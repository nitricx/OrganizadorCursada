import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService } from '../../services/course.service';
import { CourseOrganizerLegendComponent } from '../course-organizer-legend/course-organizer-legend.component';
import { CourseGridComponent } from '../course-grid/course-grid.component';

@Component({
  selector: 'app-course-organizer',
  templateUrl: './course-organizer.component.html',
  styleUrls: ['./course-organizer.component.css'],
  standalone: true,
  imports: [CommonModule, CourseOrganizerLegendComponent, CourseGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseOrganizerComponent {
  readonly courseService = inject(CourseService);
  private infoMessageSignal = signal<string>(
    'Pasá el cursor sobre una materia para ver qué requiere y qué habilita.',
  );
  readonly infoMessage = () => this.infoMessageSignal();

  onCourseCardClicked(courseId: string): void {
    this.courseService.toggleCourseStatus(courseId);
  }

  onMouseEntered(courseId: string): void {
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
        msg += ` &nbsp;·&nbsp; <span style="color:#8a4a00">Requiere: ${requirements.join(
          ', ',
        )}</span>`;
      }
      if (unlocks.length) {
        msg += ` &nbsp;·&nbsp; <span style="color:#0a5c3f">Habilita: ${unlocks.join(', ')}</span>`;
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
