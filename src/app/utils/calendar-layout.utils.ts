import { Course, DayOfWeek, Lesson } from '../models/course';

export interface CourseWithLesson {
  course: Course;
  lesson: Lesson;
}

export interface TimeSlot {
  label: string;
  row: number;
}

/**
 * Converts time string in "HH:MM" format to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Determines if two lessons overlap in time
 */
export function lessonsOverlap(cwl1: CourseWithLesson, cwl2: CourseWithLesson): boolean {
  const start1 = timeToMinutes(cwl1.lesson.startTime);
  const end1 = timeToMinutes(cwl1.lesson.endTime);
  const start2 = timeToMinutes(cwl2.lesson.startTime);
  const end2 = timeToMinutes(cwl2.lesson.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Calculates the maximum number of simultaneous overlapping lessons for a list of lessons on a day
 */
export function getMaxConcurrentLessons(courseWithLessons: CourseWithLesson[]): number {
  if (courseWithLessons.length === 0) return 1;

  const timePoints = new Set<number>();
  courseWithLessons.forEach((cwl) => {
    timePoints.add(timeToMinutes(cwl.lesson.startTime));
    timePoints.add(timeToMinutes(cwl.lesson.endTime));
  });

  const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
  let maxConcurrent = 1;

  for (const time of sortedTimes) {
    const concurrent = courseWithLessons.filter((cwl) => {
      const start = timeToMinutes(cwl.lesson.startTime);
      const end = timeToMinutes(cwl.lesson.endTime);
      return start <= time && time < end;
    }).length;

    if (concurrent > maxConcurrent) {
      maxConcurrent = concurrent;
    }
  }

  return maxConcurrent;
}

/**
 * Assigns sub-column indices (0-based) for overlapping lessons on a single day
 */
export function assignSubColumnsForDay(courseWithLessons: CourseWithLesson[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const cwl of courseWithLessons) {
    const overlappingLessons = courseWithLessons.filter((c) => lessonsOverlap(cwl, c));

    const assignedColumns = overlappingLessons
      .filter((c) => result.has(c.lesson.id))
      .map((c) => result.get(c.lesson.id)!);

    let subCol = 0;
    while (assignedColumns.includes(subCol)) {
      subCol++;
    }
    result.set(cwl.lesson.id, subCol);
  }

  return result;
}

/**
 * Maps lesson IDs to their sub-column index across all days
 */
export function computeCourseColumnMap(
  coursesByDay: Map<DayOfWeek, CourseWithLesson[]>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const courseWithLessons of coursesByDay.values()) {
    assignSubColumnsForDay(courseWithLessons).forEach((subCol, lessonId) => {
      map.set(lessonId, subCol);
    });
  }
  return map;
}

/**
 * Computes maximum concurrent lessons per day
 */
export function computeMaxConcurrentPerDay(
  coursesByDay: Map<DayOfWeek, CourseWithLesson[]>,
): Map<DayOfWeek, number> {
  const map = new Map<DayOfWeek, number>();
  for (const [day, courseWithLessons] of coursesByDay.entries()) {
    map.set(day, getMaxConcurrentLessons(courseWithLessons));
  }
  return map;
}

/**
 * Calculates maximum concurrent lessons across all days
 */
export function computeMaxConcurrentCourses(
  coursesByDay: Map<DayOfWeek, CourseWithLesson[]>,
): number {
  let max = 1;
  for (const courseWithLessons of coursesByDay.values()) {
    const concurrent = getMaxConcurrentLessons(courseWithLessons);
    if (concurrent > max) {
      max = concurrent;
    }
  }
  return max;
}

/**
 * Identifies lesson IDs that have time conflicts with other lessons on the same day
 */
export function computeOverlappingCourseIds(
  coursesByDay: Map<DayOfWeek, CourseWithLesson[]>,
): Set<string> {
  const overlappingIds = new Set<string>();
  for (const courseWithLessons of coursesByDay.values()) {
    for (const cwl of courseWithLessons) {
      const hasOverlap = courseWithLessons.some(
        (other) => other.lesson.id !== cwl.lesson.id && lessonsOverlap(cwl, other),
      );
      if (hasOverlap) {
        overlappingIds.add(cwl.lesson.id);
      }
    }
  }
  return overlappingIds;
}

/**
 * Calculates the earliest starting hour for the grid (default 8, min 0)
 */
export function calculateStartHour(courses: Course[], readOnly: boolean): number {
  if (courses.length === 0) {
    return 8;
  }
  const earliestTime = courses.reduce((min, course) => {
    const minCourseTime = course.lessons.reduce((courseMin, lesson) => {
      if (readOnly && lesson.status !== 'coursing') {
        return courseMin;
      }
      const lessonStartHour = Number.parseInt(lesson.startTime.split(':')[0], 10);
      return lessonStartHour < courseMin ? lessonStartHour : courseMin;
    }, 24);
    return minCourseTime < min ? minCourseTime : min;
  }, 24);
  return Math.max(0, earliestTime - 1);
}

/**
 * Calculates the latest ending hour for the grid (default 18, max 24)
 */
export function calculateEndHour(courses: Course[], readOnly: boolean): number {
  if (courses.length === 0) {
    return 18;
  }
  const latestTime = courses.reduce((max, course) => {
    const maxCourseTime = course.lessons.reduce((courseMax, lesson) => {
      if (readOnly && lesson.status !== 'coursing') {
        return courseMax;
      }
      const lessonEndHour = Number.parseInt(lesson.endTime.split(':')[0], 10);
      return lessonEndHour > courseMax ? lessonEndHour : courseMax;
    }, 0);
    return maxCourseTime > max ? maxCourseTime : max;
  }, 0);
  return Math.min(24, latestTime + 1);
}

/**
 * Generates array of time slot objects for grid display
 */
export function generateTimeSlots(startHour: number, endHour: number): TimeSlot[] {
  return Array.from({ length: endHour - startHour }, (_, i) => ({
    label: i % 2 === 0 ? `${(startHour + i).toString().padStart(2, '0')}:00` : '',
    row: 2 + i * 2,
  }));
}

/**
 * Formats CSS gridTemplateColumns string
 */
export function generateGridTemplateColumns(dayCount: number, maxConcurrent: number): string {
  const dayColumns = Array.from({ length: dayCount })
    .map(() => `repeat(${maxConcurrent}, 1fr)`)
    .join(' ');
  return `44px ${dayColumns}`;
}

/**
 * Formats CSS gridTemplateRows string
 */
export function generateGridTemplateRows(startHour: number, endHour: number): string {
  const numHours = endHour - startHour;
  const dataRows = 2 * numHours - 1;
  return `36px repeat(${dataRows}, 15px)`;
}

/**
 * Calculates line end column for horizontal grid lines
 */
export function calculateHourLineEnd(dayCount: number, maxConcurrent: number): number {
  return dayCount * maxConcurrent + 2;
}

/**
 * Calculates starting row index for a given time
 */
export function timeToRow(time: string, startHour: number): number {
  const [h, m] = time.split(':').map(Number);
  return 2 + (h - startHour) * 2 + m / 30;
}

/**
 * Calculates grid-column property for a lesson card
 */
export function getCourseColumnSpan(
  lessonId: string,
  dayColIndex: number,
  maxConcurrent: number,
  courseColumnMap: Map<string, number>,
  hasOverlap: boolean,
): string {
  const dayStartCol = 2 + dayColIndex * maxConcurrent;

  if (!hasOverlap) {
    return `${dayStartCol} / span ${maxConcurrent}`;
  }

  const subCol = courseColumnMap.get(lessonId) ?? 0;
  const startCol = dayStartCol + subCol;
  return `${startCol} / span 1`;
}

/**
 * Calculates grid-row property for a lesson card
 */
export function getCourseRowSpan(startTime: string, endTime: string, startHour: number): string {
  return `${timeToRow(startTime, startHour)} / ${timeToRow(endTime, startHour)}`;
}
