import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CourseService } from '../../services/course.service';
import { Course, DayOfWeek } from '../../models/course';
import { CalendarCard } from './calendar-card';

@Component({
  selector: 'app-calendar',
  imports: [CalendarCard],
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

  /**
   * Maps course IDs to their sub-column index when overlapping with other courses on the same day
   * Format: courseId -> subColumnIndex (0-based, where higher index = further right)
   */
  courseColumnMap = computed(() => {
    const map = new Map<string, number>();
    const coursesByDay = this.availableCoursesByDay();

    for (const courses of coursesByDay.values()) {
      // For each day, determine which courses overlap and assign them sub-columns
      this.assignSubColumnsForDay(courses).forEach((subCol, courseId) => {
        map.set(courseId, subCol);
      });
    }

    return map;
  });

  /**
   * Calculates the maximum number of simultaneous overlapping courses per day
   * Returns a map of DayOfWeek -> max concurrent courses for that day
   */
  maxConcurrentPerDay = computed(() => {
    const map = new Map<DayOfWeek, number>();
    const coursesByDay = this.availableCoursesByDay();

    for (const [day, courses] of coursesByDay.entries()) {
      const concurrent = this.getMaxConcurrentCourses(courses);
      map.set(day, concurrent);
    }

    return map;
  });

  /**
   * Calculates the maximum number of simultaneous overlapping courses on any day
   */
  maxConcurrentCourses = computed(() => {
    const coursesByDay = this.availableCoursesByDay();
    let max = 1;

    for (const courses of coursesByDay.values()) {
      const concurrent = this.getMaxConcurrentCourses(courses);
      if (concurrent > max) {
        max = concurrent;
      }
    }

    return max;
  });

  /**
   * Identifies which courses have time conflicts with other courses on the same day
   */
  overlappingCourseIds = computed(() => {
    const overlappingIds = new Set<string>();
    const coursesByDay = this.availableCoursesByDay();

    for (const courses of coursesByDay.values()) {
      for (const course of courses) {
        const hasOverlap = courses.some(
          (other) => other.id !== course.id && this.coursesOverlap(course, other),
        );
        if (hasOverlap) {
          overlappingIds.add(course.id);
        }
      }
    }

    return overlappingIds;
  });

  /**
   * Check if a specific course has overlaps
   */
  courseHasOverlap(courseId: string): boolean {
    return this.overlappingCourseIds().has(courseId);
  }

  /**
   * Get the max concurrent courses for a specific day
   */
  getMaxConcurrentForDay(day: DayOfWeek): number {
    return this.maxConcurrentPerDay().get(day) ?? 1;
  }

  private assignSubColumnsForDay(courses: Course[]): Map<string, number> {
    const result = new Map<string, number>();

    for (const course of courses) {
      // Find how many courses overlap with this one
      const overlappingCourses = courses.filter((c) => this.coursesOverlap(course, c));

      // Assign this course a sub-column based on how many already assigned
      const assignedColumns = overlappingCourses
        .filter((c) => result.has(c.id))
        .map((c) => result.get(c.id)!);

      let subCol = 0;
      while (assignedColumns.includes(subCol)) {
        subCol++;
      }
      result.set(course.id, subCol);
    }

    return result;
  }

  private coursesOverlap(course1: Course, course2: Course): boolean {
    const start1 = this.timeToMinutes(course1.startTime);
    const end1 = this.timeToMinutes(course1.endTime);
    const start2 = this.timeToMinutes(course2.startTime);
    const end2 = this.timeToMinutes(course2.endTime);

    return start1 < end2 && start2 < end1;
  }

  private getMaxConcurrentCourses(courses: Course[]): number {
    if (courses.length === 0) return 1;

    // Get all time points where courses start or end
    const timePoints = new Set<number>();
    courses.forEach((c) => {
      timePoints.add(this.timeToMinutes(c.startTime));
      timePoints.add(this.timeToMinutes(c.endTime));
    });

    const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
    let maxConcurrent = 1;

    // For each time point, count how many courses are active
    for (const time of sortedTimes) {
      const concurrent = courses.filter((c) => {
        const start = this.timeToMinutes(c.startTime);
        const end = this.timeToMinutes(c.endTime);
        return start <= time && time < end;
      }).length;

      if (concurrent > maxConcurrent) {
        maxConcurrent = concurrent;
      }
    }

    return maxConcurrent;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  days = computed(() => {
    const coursesByDay = this.availableCoursesByDay();
    const weekdays = this.allDays.slice(0, 5); // Monday-Friday always shown
    const saturday = this.allDays[5];
    // Only include Saturday if there are courses on that day
    const allVisibleDays =
      (coursesByDay.get(saturday.day) ?? []).length > 0 ? [...weekdays, saturday] : weekdays;
    return allVisibleDays.map((day, i) => ({ ...day, col: i + 2 }));
  });

  /**
   * Calculates columns dynamically: time-gutter (1) + each day's own max concurrent
   * Example: "44px 1fr 1fr 3fr 2fr 1fr" for days with 1, 1, 3, 2, 1 concurrent courses
   */
  gridTemplateColumns = computed(() => {
    const days = this.days();
    const maxPerDay = this.maxConcurrentPerDay();

    const dayColumns = days
      .map((day) => {
        const maxConcurrent = maxPerDay.get(day.day) ?? 1;
        // Each day gets columns equal to its max concurrent courses
        return `repeat(${maxConcurrent}, 1fr)`;
      })
      .join(' ');

    return `44px ${dayColumns}`;
  });

  hourLineEnd = computed(() => {
    const days = this.days();
    const maxPerDay = this.maxConcurrentPerDay();

    // Total columns: time-gutter (1) + sum of all day columns
    const totalDayColumns = days.reduce((sum, day) => {
      const maxConcurrent = maxPerDay.get(day.day) ?? 1;
      return sum + maxConcurrent;
    }, 0);

    return totalDayColumns + 1;
  });

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

  /**
   * Get the grid column range for a course, accounting for overlaps
   * - Non-overlapping courses span the full width of their day
   * - Overlapping courses get a sub-column based on their position
   * Accounts for variable column widths per day
   */
  getCourseColumn(course: Course, dayColIndex: number): string {
    const days = this.days();
    const maxPerDay = this.maxConcurrentPerDay();

    // Calculate the starting column for this day by summing previous days' columns
    let dayStartCol = 2; // +2 skips time-gutter and header
    for (let i = 0; i < dayColIndex; i++) {
      const dayMaxConcurrent = maxPerDay.get(days[i].day) ?? 1;
      dayStartCol += dayMaxConcurrent;
    }

    const dayMaxConcurrent = maxPerDay.get(days[dayColIndex].day) ?? 1;

    // If this course doesn't overlap, it should span the full day width
    if (!this.courseHasOverlap(course.id)) {
      return `${dayStartCol} / span ${dayMaxConcurrent}`;
    }

    // For overlapping courses, use the assigned sub-column
    const subCol = this.courseColumnMap().get(course.id) ?? 0;
    const startCol = dayStartCol + subCol;

    return `${startCol} / span 1`;
  }

  getCourseRows(course: Course): string {
    return `${this.timeToRow(course.startTime)} / ${this.timeToRow(course.endTime)}`;
  }

  private timeToRow(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return 2 + (h - this.startHour()) * 2 + m / 30;
  }
}
