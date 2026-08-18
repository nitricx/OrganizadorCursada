import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../services/course.service';
import { CourseOrganizerLegendComponent } from '../course-organizer-legend/course-organizer-legend.component';
import { CourseGridComponent } from '../course-grid/course-grid.component';
import { LessonSelectorModalComponent } from '../lesson-selector-modal/lesson-selector-modal.component';
import { Course } from '../../models/course';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-course-organizer',
  templateUrl: './course-organizer.component.html',
  styleUrls: ['./course-organizer.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    CourseOrganizerLegendComponent,
    CourseGridComponent,
    LessonSelectorModalComponent,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOrganizerComponent {
  readonly courseService = inject(CourseService);

  readonly approvedCount = computed(() => {
    return this.courseService.courses().filter(c => c.status === 'approved').length;
  });

  readonly totalCount = computed(() => {
    return this.courseService.courses().length;
  });

  readonly progressPercent = computed(() => {
    const total = this.totalCount();
    return total > 0 ? Math.round((this.approvedCount() / total) * 100) : 0;
  });

  private infoMessageSignal = signal<string>(
    'Pasá el cursor sobre una materia para ver qué requiere y qué habilita.',
  );
  readonly infoMessage = () => this.infoMessageSignal();

  readonly selectedCourseForModal = signal<Course | null>(null);
  readonly isModalOpen = signal<boolean>(false);

  onCourseCardClicked(courseId: number): void {
    const course = this.courseService.getCourseById(courseId);
    if (!course) return;

    if (course.status === 'pending' && course.lessons.length > 1 && this.courseService.canChangeStatusTo(courseId, 'coursing')) {
      this.selectedCourseForModal.set(course);
      this.isModalOpen.set(true);
    } else {
      this.courseService.toggleCourseStatus(courseId);
    }
  }

  onChangeLessonRequested(courseId: number): void {
    const course = this.courseService.getCourseById(courseId);
    if (course) {
      this.selectedCourseForModal.set(course);
      this.isModalOpen.set(true);
    }
  }

  onLessonSelected(event: { courseId: number; lessonId: string }): void {
    const course = this.courseService.getCourseById(event.courseId);
    if (!course) return;

    if (course.status === 'pending') {
      this.courseService.toggleCourseStatus(event.courseId, event.lessonId);
    } else {
      this.courseService.setSelectedLessonForCourse(event.courseId, event.lessonId);
    }
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedCourseForModal.set(null);
  }

  onMouseEntered(courseId: number): void {
    this.courseService.setHoveredCourseId(courseId);
    const course = this.courseService.getCourseById(courseId);
    if (course) {
      const requirements = this.courseService
        .getRequiredCourseIds(course)
        .map((id) => this.courseService.getCourseById(id)?.name)
        .filter((name): name is string => !!name);

      const unlocks = this.courseService
        .getUnlockedCourseIds(courseId)
        .map((id) => this.courseService.getCourseById(id)?.name)
        .filter((name): name is string => !!name);

      let msg = `<strong>${course.name}</strong>`;
      if (requirements.length) {
        msg += ` &nbsp;·&nbsp; <span class="info-req">Requiere: ${requirements.join(', ')}</span>`;
      }
      if (unlocks.length) {
        msg += ` &nbsp;·&nbsp; <span class="info-unlocks">Habilita: ${unlocks.join(', ')}</span>`;
      }
      if (!requirements.length && !unlocks.length) {
        msg += ' &nbsp;·&nbsp; Sin correlativas';
      }
      this.infoMessageSignal.set(msg);
    }
  }

  onMouseLeft(): void {
    this.courseService.setHoveredCourseId(null);
    this.infoMessageSignal.set(
      'Pasá el cursor sobre una materia para ver qué requiere y qué habilita.',
    );
  }

  onReset(): void {
    if (confirm('¿Reiniciar todas las materias a Pendiente?')) {
      this.courseService.reset();
    }
  }
}
