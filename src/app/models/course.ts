/**
 * Represents the academic completion state of a course or lesson session.
 *
 * - `'pending'` (Pendiente): Default state. Subject has not yet been enrolled or taken.
 * - `'coursing'` (Cursando): Currently attending classes during the active term. Requires direct `cursarReq` prerequisites to be at least `'coursed'` and nested prior prerequisites (`aprobarReq` of those prerequisites) to be `'approved'`.
 * - `'coursed'` (Cursada / Regular): Passed continuous assessment/attendance, pending final exam. Requires direct `cursarReq` prerequisites to be at least `'coursed'` and nested prior prerequisites to be `'approved'`.
 * - `'approved'` (Aprobada / Promocionada): Subject fully completed and credited (final exam passed or promoted). Requires direct `aprobarReq` prerequisites to be `'approved'`.
 */
export type CourseStatus = 'pending' | 'coursing' | 'coursed' | 'approved';

export enum DayOfWeek {
  Monday = 0,
  Tuesday = 1,
  Wednesday = 2,
  Thursday = 3,
  Friday = 4,
  Saturday = 5,
}

export interface Lesson {
  id: string; // e.g., 'PA1-L1', 'PA1-L2'
  professor: string;
  day: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  status?: CourseStatus; // Individual lesson status (defaults to pending)
}

export interface Course {
  id: number;
  name: string;
  year: number;
  q: number; // Quarter: 1, 2, or 3
  status: CourseStatus;
  cursarReqId: number[]; // Requirements to take the course
  aprobarReqId: number[]; // Requirements to approve the course
  lessons: Lesson[]; // Multiple lessons per subject with different professors
}
