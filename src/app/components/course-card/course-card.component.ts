import { Component, input, output, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../models/course';
import { CourseService } from '../../services/course.service';

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
  readonly selectedIds = input.required<Set<string>>();

  readonly cardClicked = output<string>();
  readonly mouseEntered = output<string>();
  readonly mouseLeft = output<void>();

  private readonly courseService = inject(CourseService);

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
    const courseName = currentCourse.name;

    const hoveredId = this.courseService.hoveredCourseId();

    if (hoveredId) {
      if (hoveredId === courseId || hoveredId === courseName) {
        return ' hovered';
      }

      const reqSet = this.courseService.hoveredRequiredSet();
      if (reqSet.has(courseId) || reqSet.has(courseName)) {
        if (currentCourse.status === 'approved') {
          return '';
        }
        return ' req-highlight';
      }

      const unlockSet = this.courseService.hoveredUnlockedSet();
      if (unlockSet.has(courseId) || unlockSet.has(courseName)) {
        return ' unlocks-highlight';
      }

      return ' dim';
    }

    const selectedIds = this.selectedIds();

    if (selectedIds.size === 0) return '';

    if (selectedIds.has(courseId) || selectedIds.has(courseName)) {
      return ' selected';
    }

    const needsSet = new Set<string>();
    selectedIds.forEach((sid) => {
      const selectedCourse = this.courseService.getCourseById(sid);
      if (selectedCourse) {
        this.courseService.getRequiredCourseIds(selectedCourse).forEach((id) => {
          needsSet.add(id);
        });
      }
    });

    if (needsSet.has(courseId) || needsSet.has(courseName)) {
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

  onMouseEnter(): void {
    this.mouseEntered.emit(this.course().id);
  }

  onMouseLeave(): void {
    this.mouseLeft.emit();
  }
}
