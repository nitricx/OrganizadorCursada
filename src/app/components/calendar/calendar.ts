import { Component, ChangeDetectionStrategy, signal, computed, inject, input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CourseService } from '../../services/course.service';
import { PlanService } from '../../services/plan.service';
import { Course, DayOfWeek, Lesson } from '../../models/course';
import { CalendarCard } from '../calendar-card/calendar-card';

interface CourseWithLesson {
  course: Course;
  lesson: Lesson;
}

@Component({
  selector: 'app-calendar',
  imports: [CalendarCard, CommonModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly courseService = inject(CourseService);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** When provided, these courses are shown directly instead of the user's active coursing courses */
  coursesOverride = input<Course[] | undefined>(undefined);

  /** Whether to show the "Mi Semana" title header */
  showHeader = input<boolean>(true);

  currentDate = signal(new Date());

  /** Track the selected plan from the route */
  private readonly routePlanId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('planId'))),
    { initialValue: undefined },
  );

  /** Selected plan ID signal (defaults to the first available plan) */
  selectedPlanId = computed(() => {
    const routeId = this.routePlanId();
    if (routeId) {
      return routeId;
    }
    const plans = this.availablePlans();
    return plans.length > 0 ? plans[0].id : '';
  });

  /** Available plans for selection */
  availablePlans = this.planService.plans;

  /** Handle plan selection change */
  onPlanChange(planId: string): void {
    if (planId) {
      this.router.navigate(['/myWeek/plan', planId]);
    }
  }

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
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));

    const map = new Map<DayOfWeek, CourseWithLesson[]>();
    for (const entry of this.allDays) {
      map.set(entry.day, []);
    }
    courses.forEach((c) => {
      // Add all lessons for this course
      c.lessons.forEach((lesson) => {
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
  courseColumnMap = computed(() => {
    const map = new Map<string, number>();
    const coursesByDay = this.availableCoursesByDay();

    for (const courseWithLessons of coursesByDay.values()) {
      // For each day, determine which courses overlap and assign them sub-columns
      this.assignSubColumnsForDay(courseWithLessons).forEach((subCol, lessonId) => {
        map.set(lessonId, subCol);
      });
    }

    return map;
  });

  /**
   * Calculates the maximum number of simultaneous overlapping lessons per day
   * Returns a map of DayOfWeek -> max concurrent lessons for that day
   */
  maxConcurrentPerDay = computed(() => {
    const map = new Map<DayOfWeek, number>();
    const coursesByDay = this.availableCoursesByDay();

    for (const [day, courseWithLessons] of coursesByDay.entries()) {
      const concurrent = this.getMaxConcurrentLessons(courseWithLessons);
      map.set(day, concurrent);
    }

    return map;
  });

  /**
   * Calculates the maximum number of simultaneous overlapping lessons on any day
   */
  maxConcurrentCourses = computed(() => {
    const coursesByDay = this.availableCoursesByDay();
    let max = 1;

    for (const courseWithLessons of coursesByDay.values()) {
      const concurrent = this.getMaxConcurrentLessons(courseWithLessons);
      if (concurrent > max) {
        max = concurrent;
      }
    }

    return max;
  });

  /**
   * Identifies which lessons have time conflicts with other lessons on the same day
   */
  overlappingCourseIds = computed(() => {
    const overlappingIds = new Set<string>();
    const coursesByDay = this.availableCoursesByDay();

    for (const courseWithLessons of coursesByDay.values()) {
      for (const cwl of courseWithLessons) {
        const hasOverlap = courseWithLessons.some(
          (other) => other.lesson.id !== cwl.lesson.id && this.lessonsOverlap(cwl, other),
        );
        if (hasOverlap) {
          overlappingIds.add(cwl.lesson.id);
        }
      }
    }

    return overlappingIds;
  });

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

  private assignSubColumnsForDay(courseWithLessons: CourseWithLesson[]): Map<string, number> {
    const result = new Map<string, number>();

    for (const cwl of courseWithLessons) {
      // Find how many lessons overlap with this one
      const overlappingLessons = courseWithLessons.filter((c) => this.lessonsOverlap(cwl, c));

      // Assign this lesson a sub-column based on how many already assigned
      const assignedColumns = overlappingLessons
        .filter((c) => result.has(c.lesson.id))
        .map((c) => result.get(c.lesson.id)!);

      let subCol = 0;
      while (assignedColumns.includes(subCol)) {
        subCol++;
      }
      result.set(cwl.lesson.id, subCol);
    }

    return result;
  }

  private lessonsOverlap(cwl1: CourseWithLesson, cwl2: CourseWithLesson): boolean {
    const lesson1 = cwl1.lesson;
    const lesson2 = cwl2.lesson;

    const start1 = this.timeToMinutes(lesson1.startTime);
    const end1 = this.timeToMinutes(lesson1.endTime);
    const start2 = this.timeToMinutes(lesson2.startTime);
    const end2 = this.timeToMinutes(lesson2.endTime);

    return start1 < end2 && start2 < end1;
  }

  private getMaxConcurrentLessons(courseWithLessons: CourseWithLesson[]): number {
    if (courseWithLessons.length === 0) return 1;

    // Get all time points where lessons start or end
    const timePoints = new Set<number>();
    courseWithLessons.forEach((cwl) => {
      const lesson = cwl.lesson;
      timePoints.add(this.timeToMinutes(lesson.startTime));
      timePoints.add(this.timeToMinutes(lesson.endTime));
    });

    const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
    let maxConcurrent = 1;

    // For each time point, count how many lessons are active
    for (const time of sortedTimes) {
      const concurrent = courseWithLessons.filter((cwl) => {
        const lesson = cwl.lesson;
        const start = this.timeToMinutes(lesson.startTime);
        const end = this.timeToMinutes(lesson.endTime);
        return start <= time && time < end;
      }).length;

      if (concurrent > maxConcurrent) {
        maxConcurrent = concurrent;
      }
    }

    return maxConcurrent;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
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
   * Each day gets the same number of columns (the max concurrent courses across all days)
   * This ensures all day columns have equal width
   * Example: "44px 1fr 1fr 1fr 1fr 1fr 1fr" for 5 days with max 2 concurrent courses
   */
  gridTemplateColumns = computed(() => {
    const days = this.days();
    const maxConcurrent = this.maxConcurrentCourses();

    const dayColumns = days.map(() => `repeat(${maxConcurrent}, 1fr)`).join(' ');

    return `44px ${dayColumns}`;
  });

  hourLineEnd = computed(() => {
    const days = this.days();
    const maxConcurrent = this.maxConcurrentCourses();

    // Total columns: time-gutter (1) + (days.length * maxConcurrent)
    const totalDayColumns = days.length * maxConcurrent;

    return totalDayColumns + 1;
  });

  private readonly startHour = computed(() => {
    const override = this.coursesOverride();
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));
    if (courses.length === 0) {
      return 8; // Default if no courses
    }
    const earliestTime = courses.reduce((min, course) => {
      // Check all lessons, not just the first one
      const minCourseTime = course.lessons.reduce((courseMin, lesson) => {
        const lessonStartHour = parseInt(lesson.startTime.split(':')[0]);
        return lessonStartHour < courseMin ? lessonStartHour : courseMin;
      }, 24);
      return minCourseTime < min ? minCourseTime : min;
    }, 24);
    return Math.max(0, earliestTime - 1);
  });

  private readonly endHour = computed(() => {
    const override = this.coursesOverride();
    const courses =
      override !== undefined
        ? override
        : this.courseService
            .courses()
            .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));
    if (courses.length === 0) {
      return 18; // Default if no courses
    }
    const latestTime = courses.reduce((max, course) => {
      // Check all lessons, not just the first one
      const maxCourseTime = course.lessons.reduce((courseMax, lesson) => {
        const lessonEndHour = parseInt(lesson.endTime.split(':')[0]);
        return lessonEndHour > courseMax ? lessonEndHour : courseMax;
      }, 0);
      return maxCourseTime > max ? maxCourseTime : max;
    }, 0);
    return Math.min(24, latestTime + 1);
  });

  timeSlots = computed(() => {
    const start = this.startHour();
    const end = this.endHour();
    return Array.from({ length: end - start }, (_, i) => ({
      label: `${(start + i).toString().padStart(2, '0')}:00`,
      row: 2 + i * 2, // row 1 = header, row 2 = START_HOUR, each 30min = 1 row
    }));
  });

  /**
   * Calculates the dynamic grid template rows based on the number of hours needed
   * Row 1: header (36px)
   * Rows 2+: time slots (30px each)
   * Formula: highestRowNeeded = 2 * (endHour - startHour)
   */
  gridTemplateRows = computed(() => {
    const numHours = this.endHour() - this.startHour();
    const dataRows = 2 * numHours - 1;
    return `36px repeat(${dataRows}, 30px)`;
  });

  /**
   * Get the grid column range for a lesson, accounting for overlaps
   * - Non-overlapping lessons span the full width of their day
   * - Overlapping lessons get a sub-column based on their position
   * All days have the same width (maxConcurrentCourses across all days)
   */
  getCourseColumn(courseWithLesson: CourseWithLesson, dayColIndex: number): string {
    const maxConcurrent = this.maxConcurrentCourses();

    // Calculate the starting column for this day
    // dayColIndex 0 = column 2 (skip time-gutter at 1)
    // dayColIndex 1 = column 2 + maxConcurrent
    // dayColIndex 2 = column 2 + 2*maxConcurrent, etc.
    const dayStartCol = 2 + dayColIndex * maxConcurrent;

    // If this lesson doesn't overlap, it should span the full day width
    if (!this.courseHasOverlap(courseWithLesson.lesson.id)) {
      return `${dayStartCol} / span ${maxConcurrent}`;
    }

    // For overlapping lessons, use the assigned sub-column
    const subCol = this.courseColumnMap().get(courseWithLesson.lesson.id) ?? 0;
    const startCol = dayStartCol + subCol;

    return `${startCol} / span 1`;
  }

  getCourseRows(courseWithLesson: CourseWithLesson): string {
    const lesson = courseWithLesson.lesson;
    return `${this.timeToRow(lesson.startTime)} / ${this.timeToRow(lesson.endTime)}`;
  }

  private timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 2 + (h - this.startHour()) * 2 + m / 30;
  }
}
