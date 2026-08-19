import { Component, input, output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course, Lesson, DayOfWeek } from '../../../models/course';

import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-lesson-selector-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
  ],
  templateUrl: './lesson-selector-modal.component.html',
  styleUrls: ['./lesson-selector-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonSelectorModalComponent {
  readonly course = input<Course | null>(null);
  readonly isOpen = input<boolean>(false);

  readonly closed = output<void>();
  readonly lessonSelected = output<{ courseId: number; lessonId: string }>();

  readonly tempSelectedLessonId = signal<string | null>(null);

  private readonly dayNames: Record<DayOfWeek, string> = {
    [DayOfWeek.Monday]: 'Lunes',
    [DayOfWeek.Tuesday]: 'Martes',
    [DayOfWeek.Wednesday]: 'Miércoles',
    [DayOfWeek.Thursday]: 'Jueves',
    [DayOfWeek.Friday]: 'Viernes',
    [DayOfWeek.Saturday]: 'Sábado',
  };

  getDayName(day: DayOfWeek): string {
    return this.dayNames[day] ?? 'Día no especificado';
  }

  selectLesson(lessonId: string): void {
    this.tempSelectedLessonId.set(lessonId);
  }

  confirmSelection(): void {
    const c = this.course();
    const selectedId = this.tempSelectedLessonId() ?? c?.selectedLessonId ?? c?.lessons[0]?.id;
    if (c && selectedId) {
      this.lessonSelected.emit({ courseId: c.id, lessonId: selectedId });
    }
    this.closeModal();
  }

  closeModal(): void {
    this.tempSelectedLessonId.set(null);
    this.closed.emit();
  }
}
