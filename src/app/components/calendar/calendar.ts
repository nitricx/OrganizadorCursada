import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { Course, DayOfWeek } from '../../models/course';

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendar {
  private readonly courseService = inject(CourseService);

  currentDate = signal(new Date());

  days: { label: string; day: DayOfWeek }[] = [
    { label: 'Monday', day: DayOfWeek.Monday },
    { label: 'Tuesday', day: DayOfWeek.Tuesday },
    { label: 'Wednesday', day: DayOfWeek.Wednesday },
    { label: 'Thursday', day: DayOfWeek.Thursday },
    { label: 'Friday', day: DayOfWeek.Friday },
  ];

  availableCoursesByDay = computed(() => {
    const courses = this.courseService.courses();
    const map = new Map<DayOfWeek, Course[]>();
    for (const entry of this.days) {
      map.set(entry.day, []);
    }
    courses
      .filter((c) => c.status === 'pending' && this.courseService.areAllRequirementsMet(c))
      .forEach((c) => {
        map.get(c.day)?.push(c);
      });
    return map;
  });
}
