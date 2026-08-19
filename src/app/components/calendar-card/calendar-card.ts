import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course, Lesson } from '../../models/course';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-calendar-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-card.html',
  styleUrl: './calendar-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.tabindex]': 'isEditable() ? 0 : null',
    '[attr.aria-label]':
      'isEditable() ? course().name + (course().q === 3 ? ". Presione Alt + Flecha Abajo o Flecha Arriba para cambiar de año." : ". Presione Alt + Flecha Abajo o Flecha Arriba para cambiar de cuatrimestre.") : course().name',
    '[style.z-index]': 'isDragging() ? 100 : 1',
    '[style.cursor]': 'isEditable() ? (isDragging() ? "grabbing" : "grab") : "default"',
    '[class.is-dragging]': 'isDragging()',
  },
})
export class CalendarCard {
  course = input.required<Course>();
  lesson = input.required<Lesson>();
  isReadOnly = input<boolean>(false);
  isEditable = input<boolean>(true);
  clickTogglesStatus = input<boolean>(true);
  lessonMoveRequested = output<{
    lessonId: string;
    direction: 'next' | 'prev';
    courseYear: number;
    courseQ: number;
  }>();
  isDragging = signal(false);

  private readonly courseService = inject(CourseService);
  private hasDragged = false;

  @HostListener('click')
  onCardClick(): void {
    if (this.isReadOnly()) return;
    if (!this.clickTogglesStatus()) return;
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    const lesson = this.lesson();
    this.courseService.toggleLessonStatus(lesson.id);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isEditable()) return;

    if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 'next' : 'prev';
      const course = this.course();
      const lesson = this.lesson();
      this.lessonMoveRequested.emit({
        lessonId: lesson.id,
        direction,
        courseYear: course.year,
        courseQ: course.q,
      });
    }
  }

  markDragged(): void {
    this.hasDragged = true;
  }
}

