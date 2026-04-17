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

  private readonly allDays: { label: string; day: DayOfWeek; col: number }[] = [
    { label: 'Monday', day: DayOfWeek.Monday, col: 2 },
    { label: 'Tuesday', day: DayOfWeek.Tuesday, col: 3 },
    { label: 'Wednesday', day: DayOfWeek.Wednesday, col: 4 },
    { label: 'Thursday', day: DayOfWeek.Thursday, col: 5 },
    { label: 'Friday', day: DayOfWeek.Friday, col: 6 },
    { label: 'Saturday', day: DayOfWeek.Saturday, col: 7 },
  ];

  availableCoursesByDay = computed(() => {
    const courses = this.courseService.courses();
    const map = new Map<DayOfWeek, Course[]>();
    for (const entry of this.allDays) {
      map.set(entry.day, []);
    }
    courses
      .filter((c) => c.status === 'pending' && this.courseService.areAllRequirementsMet(c))
      .forEach((c) => {
        map.get(c.day)?.push(c);
      });
    return map;
  });

  days = computed(() => this.allDays.map((day, i) => ({ ...day, col: i + 2 })));

  gridTemplateColumns = computed(() => `44px repeat(${this.days().length}, 1fr)`);

  hourLineEnd = computed(() => this.days().length + 2);

  private readonly startHour = computed(() => {
    const courses = this.courseService
      .courses()
      .filter((c) => c.status === 'pending' && this.courseService.areAllRequirementsMet(c));
    if (courses.length === 0) {
      return 8; // Default if no courses
    }
    const earliestTime = courses.reduce((min, course) => {
      const courseStartHour = parseInt(course.startTime.split(':')[0]);
      return courseStartHour < min ? courseStartHour : min;
    }, 24);
    return Math.max(0, earliestTime - 1);
  });

  private readonly endHour = computed(() => {
    const courses = this.courseService
      .courses()
      .filter((c) => c.status === 'pending' && this.courseService.areAllRequirementsMet(c));
    if (courses.length === 0) {
      return 18; // Default if no courses
    }
    const latestTime = courses.reduce((max, course) => {
      const courseEndHour = parseInt(course.endTime.split(':')[0]);
      return courseEndHour > max ? courseEndHour : max;
    }, 0);
    return Math.min(24, latestTime + 1);
  });

  timeSlots = computed(() => {
    const start = this.startHour();
    const end = this.endHour();
    return Array.from({ length: end - start }, (_, i) => ({
      label: `${(start + i).toString().padStart(2, '0')}:00`,
      row: 2 + i * 2, // row 1 = header, row 2 = START_HOUR, each 30min = 1 row
    }));
  });

  getCourseRows(course: Course): string {
    return `${this.timeToRow(course.startTime)} / ${this.timeToRow(course.endTime)}`;
  }

  private timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 2 + (h - this.startHour()) * 2 + m / 30;
  }
}
