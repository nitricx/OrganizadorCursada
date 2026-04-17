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

  private readonly START_HOUR = 8;
  private readonly END_HOUR = 18;

  currentDate = signal(new Date());

  days: { label: string; day: DayOfWeek; col: number }[] = [
    { label: 'Monday', day: DayOfWeek.Monday, col: 2 },
    { label: 'Tuesday', day: DayOfWeek.Tuesday, col: 3 },
    { label: 'Wednesday', day: DayOfWeek.Wednesday, col: 4 },
    { label: 'Thursday', day: DayOfWeek.Thursday, col: 5 },
    { label: 'Friday', day: DayOfWeek.Friday, col: 6 },
  ];

  // One label per hour from START_HOUR to END_HOUR-1
  timeSlots = Array.from({ length: this.END_HOUR - this.START_HOUR }, (_, i) => ({
    label: `${(this.START_HOUR + i).toString().padStart(2, '0')}:00`,
    row: 2 + i * 2, // row 1 = header, row 2 = START_HOUR, each 30min = 1 row
  }));

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

  getCourseRows(course: Course): string {
    return `${this.timeToRow(course.startTime)} / ${this.timeToRow(course.endTime)}`;
  }

  private timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 2 + (h - this.START_HOUR) * 2 + m / 30;
  }
}
