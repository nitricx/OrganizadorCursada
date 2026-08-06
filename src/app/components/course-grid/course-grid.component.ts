import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../models/course';
import { CourseCardComponent } from '../course-card/course-card.component';

@Component({
  selector: 'app-course-grid',
  standalone: true,
  templateUrl: './course-grid.component.html',
  styleUrls: ['./course-grid.component.css'],
  imports: [CommonModule, CourseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseGridComponent {
  readonly courses = input.required<Course[]>();
  readonly selectedIds = input.required<Set<number>>();

  getQuarterLabel(q: number): string {
    return this.quarterLabels[q] || '';
  }

  onCardClicked(courseId: number): void {
    this.cardClicked.emit(courseId);
  }

  onMouseEntered(courseId: number): void {
    this.mouseEntered.emit(courseId);
  }

  onMouseLeft(): void {
    this.mouseLeft.emit();
  }

  readonly cardClicked = output<number>();
  readonly mouseEntered = output<number>();
  readonly mouseLeft = output<void>();

  private readonly quarterLabels: Record<number, string> = {
    1: '1er cuatrimestre',
    2: '2do cuatrimestre',
    3: 'Anual',
  };

  getCoursesForYearAndQuarter(year: number, quarter: number): Course[] {
    const filtered = this.courses().filter((c) => c.year === year && c.q === quarter);
    // Annual subjects (q === 3) should appear at the top
    if (quarter === 3) {
      return filtered.sort((a, b) => 0); // Already only annual, no further sort needed
    }
    // For other quarters, put annuals (q === 3) at the top if present (shouldn't happen, but for safety)
    return filtered.sort((a, b) => {
      if (a.q === 3 && b.q !== 3) return -1;
      if (a.q !== 3 && b.q === 3) return 1;
      return 0;
    });
  }
}
