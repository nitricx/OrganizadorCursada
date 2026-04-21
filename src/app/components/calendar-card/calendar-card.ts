import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  HostListener,
  signal,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course, Lesson } from '../../models/course';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-calendar-card',
  imports: [CommonModule],
  templateUrl: './calendar-card.html',
  styleUrl: './calendar-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.transform]': '"translateY(" + dragY() + "px)"',
    '[style.transition]':
      'isDragging() ? "none" : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease"',
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
  lessonMoveRequested = output<{
    lessonId: string;
    direction: 'next' | 'prev';
    courseYear: number;
    courseQ: number;
  }>();
  debugMode = signal(false);
  isDragging = signal(false);
  dragY = signal(0);

  private readonly courseService = inject(CourseService);
  private readonly el = inject(ElementRef);
  private dragStartY = 0;
  private hasDragged = false;

  @HostListener('click')
  onCardClick(): void {
    if (this.isReadOnly()) return;
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    const lesson = this.lesson();
    const course = this.course();
    console.log(`🖱️ Clicked: ${course.name} - ${lesson.id} (${lesson.status})`);
    this.courseService.toggleLessonStatus(lesson.id);
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (!this.isEditable()) return;
    if ((event.target as HTMLElement).closest('.debug-button')) return;
    const el = this.el.nativeElement as HTMLElement;
    el.setPointerCapture(event.pointerId);
    this.dragStartY = event.clientY;
    this.hasDragged = false;
    this.isDragging.set(true);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging()) return;
    const dy = event.clientY - this.dragStartY;
    this.dragY.set(dy);
    if (Math.abs(dy) > 3) {
      this.hasDragged = true;
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  onPointerUp(): void {
    if (!this.isDragging()) return;

    const el = this.el.nativeElement as HTMLElement;
    const cardHeight = el.offsetHeight;
    const threshold = cardHeight * 0.5;
    const currentDragY = this.dragY();

    const course = this.course();
    const lesson = this.lesson();

    if (currentDragY > threshold) {
      this.lessonMoveRequested.emit({
        lessonId: lesson.id,
        direction: 'next',
        courseYear: course.year,
        courseQ: course.q,
      });
    } else if (currentDragY < -threshold) {
      this.lessonMoveRequested.emit({
        lessonId: lesson.id,
        direction: 'prev',
        courseYear: course.year,
        courseQ: course.q,
      });
    }

    this.isDragging.set(false);
    this.dragY.set(0);
  }

  toggleDebugMode(event: MouseEvent): void {
    event.stopPropagation();
    this.debugMode.update((value) => !value);
  }
}
