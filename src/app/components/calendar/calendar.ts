import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { CourseService } from '../../services/course.service';
import { PlanService } from '../../services/plan.service';
import { Course, DayOfWeek } from '../../models/course';
import { CalendarCard } from '../calendar-card/calendar-card';
import { CalendarLegendComponent } from '../calendar-legend/calendar-legend.component';
import {
  CourseWithLesson,
  computeCourseColumnMap,
  computeMaxConcurrentPerDay,
  computeMaxConcurrentCourses,
  computeOverlappingCourseIds,
  calculateStartHour,
  calculateEndHour,
  generateTimeSlots,
  generateGridTemplateColumns,
  generateGridTemplateRows,
  calculateHourLineEnd,
  getCourseColumnSpan,
  getCourseRowSpan,
} from '../../utils/calendar-layout.utils';

export type { CourseWithLesson };

@Component({
  selector: 'app-calendar',
  imports: [CalendarCard, CalendarLegendComponent, CommonModule, DragDropModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly courseService = inject(CourseService);
  private readonly planService = inject(PlanService);

  /** When provided, these courses are shown directly instead of the user's active coursing courses */
  coursesOverride = input<Course[] | undefined>(undefined);

  /** Whether to show the "Mi Semana" title header */
  showHeader = input<boolean>(true);

  /** Whether the calendar is editable (allows dragging) */
  isEditable = input<boolean>(true);

  /** Whether clicking on a lesson should toggle its status */
  clickTogglesStatus = input<boolean>(true);

  lessonMoveRequested = output<{
    lessonId: string;
    direction: 'next' | 'prev';
    courseYear: number;
    courseQ: number;
  }>();

  currentDate = signal(new Date());

  /** Selected plan ID signal (defaults to the first available plan) */
  selectedPlanId = this.planService.selectedPlanId;

  /** Available plans for selection */
  availablePlans = this.planService.plans;

  /** Handle plan selection change (no navigation, just update selection) */
  onPlanChange(planId: string): void {
    this.planService.setSelectedPlanId(planId);
    this.courseService.setCurrentPlanId(planId);
  }

  /** Determine if calendar is read-only (true when no override provided, i.e., on /myWeek) */
  isReadOnly = computed(() => {
    return this.coursesOverride() === undefined;
  });

  private readonly allDays: { label: string; day: DayOfWeek; col: number }[] = [
    { label: 'Lunes', day: DayOfWeek.Monday, col: 2 },
    { label: 'Martes', day: DayOfWeek.Tuesday, col: 3 },
    { label: 'Miércoles', day: DayOfWeek.Wednesday, col: 4 },
    { label: 'Jueves', day: DayOfWeek.Thursday, col: 5 },
    { label: 'Viernes', day: DayOfWeek.Friday, col: 6 },
    { label: 'Sábado', day: DayOfWeek.Saturday, col: 7 },
  ];

  availableCoursesByDay = computed(() => {
    const override = this.coursesOverride();
    const readOnly = this.isReadOnly();
    // Ensure plan is synced before computing courses
    this.selectedPlanId();
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));

    // Deduplicate courses by ID (annual courses may appear in multiple semesters)
    const seenCourseIds = new Set<number>();
    const uniqueCourses = courses.filter((c) => {
      if (seenCourseIds.has(c.id)) return false;
      seenCourseIds.add(c.id);
      return true;
    });

    const map = new Map<DayOfWeek, CourseWithLesson[]>();
    for (const entry of this.allDays) {
      map.set(entry.day, []);
    }
    uniqueCourses.forEach((c) => {
      // Add all lessons for this course
      c.lessons.forEach((lesson) => {
        // On /myWeek (read-only), only show lessons that are 'coursing'
        if (readOnly && lesson.status !== 'coursing') {
          return;
        }
        const day = lesson.day;
        map.get(day)?.push({ course: c, lesson });
      });
    });
    return map;
  });

  /**
   * Maps lesson IDs to their sub-column index when overlapping with other lessons on the same day
   * Format: lessonId -> subColumnIndex (0-based, where higher index = further right)
   */
  courseColumnMap = computed(() => computeCourseColumnMap(this.availableCoursesByDay()));

  /**
   * Calculates the maximum number of simultaneous overlapping lessons per day
   * Returns a map of DayOfWeek -> max concurrent lessons for that day
   */
  maxConcurrentPerDay = computed(() => computeMaxConcurrentPerDay(this.availableCoursesByDay()));

  /**
   * Calculates the maximum number of simultaneous overlapping lessons on any day
   */
  maxConcurrentCourses = computed(() => computeMaxConcurrentCourses(this.availableCoursesByDay()));

  /**
   * Identifies which lessons have time conflicts with other lessons on the same day
   */
  overlappingCourseIds = computed(() => computeOverlappingCourseIds(this.availableCoursesByDay()));

  /**
   * Check if a specific lesson has overlaps
   */
  courseHasOverlap(lessonId: string): boolean {
    return this.overlappingCourseIds().has(lessonId);
  }

  /**
   * Get the max concurrent courses for a specific day
   */
  getMaxConcurrentForDay(day: DayOfWeek): number {
    return this.maxConcurrentPerDay().get(day) ?? 1;
  }

  days = computed(() => {
    const coursesByDay = this.availableCoursesByDay();
    const weekdays = this.allDays.slice(0, 5); // Monday-Friday always shown
    const saturday = this.allDays[5];
    // Only include Saturday if there are courses on that day
    const allVisibleDays =
      (coursesByDay.get(saturday.day) ?? []).length > 0 ? [...weekdays, saturday] : weekdays;
    return allVisibleDays.map((day, i) => ({ ...day, col: i + 2 }));
  });

  /**
   * Calculates columns dynamically: time-gutter (1) + same width for each day
   */
  gridTemplateColumns = computed(() =>
    generateGridTemplateColumns(this.days().length, this.maxConcurrentCourses()),
  );

  hourLineEnd = computed(() =>
    calculateHourLineEnd(this.days().length, this.maxConcurrentCourses()),
  );

  private readonly startHour = computed(() => {
    const override = this.coursesOverride();
    const readOnly = this.isReadOnly();
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));
    return calculateStartHour(courses, readOnly);
  });

  private readonly endHour = computed(() => {
    const override = this.coursesOverride();
    const readOnly = this.isReadOnly();
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));
    return calculateEndHour(courses, readOnly);
  });

  timeSlots = computed(() => generateTimeSlots(this.startHour(), this.endHour()));

  gridTemplateRows = computed(() => generateGridTemplateRows(this.startHour(), this.endHour()));

  /**
   * Get the grid column range for a lesson, accounting for overlaps
   */
  getCourseColumn(courseWithLesson: CourseWithLesson, dayColIndex: number): string {
    return getCourseColumnSpan(
      courseWithLesson.lesson.id,
      dayColIndex,
      this.maxConcurrentCourses(),
      this.courseColumnMap(),
      this.courseHasOverlap(courseWithLesson.lesson.id),
    );
  }

  getCourseRows(courseWithLesson: CourseWithLesson): string {
    return getCourseRowSpan(
      courseWithLesson.lesson.startTime,
      courseWithLesson.lesson.endTime,
      this.startHour(),
    );
  }

  onCardDragStarted(cardComponent?: CalendarCard): void {
    if (cardComponent) {
      cardComponent.isDragging.set(true);
    }
  }

  onCardDragEnded(
    event: CdkDragEnd,
    courseWithLesson: CourseWithLesson,
    cardComponent?: CalendarCard,
  ): void {
    if (cardComponent) {
      cardComponent.isDragging.set(false);
    }

    const cardElement = event.source.element.nativeElement;
    const cardHeight = cardElement.offsetHeight;
    const threshold = Math.max(25, cardHeight * 0.4);
    const dy = event.distance.y;

    if (Math.abs(dy) > 5 && cardComponent) {
      cardComponent.markDragged();
    }

    const course = courseWithLesson.course;
    const lesson = courseWithLesson.lesson;

    if (dy > threshold) {
      this.lessonMoveRequested.emit({
        lessonId: lesson.id,
        direction: 'next',
        courseYear: course.year,
        courseQ: course.q,
      });
    } else if (dy < -threshold) {
      this.lessonMoveRequested.emit({
        lessonId: lesson.id,
        direction: 'prev',
        courseYear: course.year,
        courseQ: course.q,
      });
    }

    event.source.reset();
  }
}
