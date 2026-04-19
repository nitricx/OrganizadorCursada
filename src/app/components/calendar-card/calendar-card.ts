import { Component, ChangeDetectionStrategy, input, inject, HostListener } from '@angular/core';
import { Course, Lesson } from '../../models/course';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-calendar-card',
  imports: [],
  templateUrl: './calendar-card.html',
  styleUrl: './calendar-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCard {
  course = input.required<Course>();
  lesson = input.required<Lesson>();
  private readonly courseService = inject(CourseService);

  @HostListener('click')
  onCardClick(): void {
    const lesson = this.lesson();
    const course = this.course();
    console.log(`🖱️ Clicked: ${course.name} - ${lesson.id} (${lesson.status})`);
    this.courseService.toggleLessonStatus(lesson.id);
  }
}
