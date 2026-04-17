export type CourseStatus = 'pending' | 'coursed' | 'approved';

export enum DayOfWeek {
  Monday = 0,
  Tuesday = 1,
  Wednesday = 2,
  Thursday = 3,
  Friday = 4,
  Saturday = 5,
}

export interface Course {
  id: string;
  name: string;
  year: number;
  q: number; // Quarter: 1, 2, or 3
  status: CourseStatus;
  cursarReq: string[]; // Requirements to take the course
  aprobarReq: string[]; // Requirements to approve the course
  professor: string;
  day: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}
