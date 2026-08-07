import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../models/course';
import { CourseService } from '../../services/course.service';
import { getCourseStatusTag } from '../../constants/course-status.constants';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  readonly course = input.required<Course>();
  readonly selectedIds = input.required<Set<number>>();

  readonly cardClicked = output<number>();
  readonly changeLessonClicked = output<number>();
  readonly mouseEntered = output<number>();
  readonly mouseLeft = output<void>();

  private readonly courseService = inject(CourseService);

  statusTag = computed(() => {
    return getCourseStatusTag(this.course().status);
  });

  selectedLessonProf = computed(() => {
    const c = this.course();
    if (!c.selectedLessonId) return null;
    const lesson = c.lessons.find((l) => l.id === c.selectedLessonId);
    return lesson ? lesson.professor : null;
  });

  unlocks = computed(() => {
    const c = this.course();
    const unlockedIds = this.courseService.getUnlockedCourseIds(c.id);
    return unlockedIds
      .map((id) => this.courseService.getCourseById(id)?.name)
      .filter((name): name is string => !!name);
  });

  allRequirementsMet = computed(() => {
    return this.courseService.areAllRequirementsMet(this.course());
  });

  highlightClass = computed(() => {
    const currentCourse = this.course();
    const courseId = currentCourse.id;

    const hoveredId = this.courseService.hoveredCourseId();

    if (hoveredId !== null) {
      if (hoveredId === courseId) {
        return ' hovered';
      }

      const reqSet = this.courseService.hoveredRequiredSet();
      if (reqSet.has(courseId)) {
        if (currentCourse.status === 'approved') {
          return '';
        }
        return ' req-highlight';
      }

      const unlockSet = this.courseService.hoveredUnlockedSet();
      if (unlockSet.has(courseId)) {
        return ' unlocks-highlight';
      }

      return ' dim';
    }

    const selectedIds = this.selectedIds();

    if (selectedIds.size === 0) return '';

    if (selectedIds.has(courseId)) {
      return ' selected';
    }

    const needsSet = new Set<number>();
    selectedIds.forEach((sid) => {
      const selectedCourse = this.courseService.getCourseById(sid);
      if (selectedCourse) {
        this.courseService.getRequiredCourseIds(selectedCourse).forEach((id) => {
          needsSet.add(id);
        });
      }
    });

    if (needsSet.has(courseId)) {
      if (currentCourse.status === 'approved') {
        return '';
      }
      return ' req-highlight';
    }

    return ' dim';
  });

  onCardClick(): void {
    this.cardClicked.emit(this.course().id);
  }

  onChangeLesson(event: Event): void {
    event.stopPropagation();
    this.changeLessonClicked.emit(this.course().id);
  }

  onMouseEnter(): void {
    this.mouseEntered.emit(this.course().id);
  }

  onMouseLeave(): void {
    this.mouseLeft.emit();
  }
}
