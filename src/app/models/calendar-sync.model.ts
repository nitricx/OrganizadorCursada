import { Course, Lesson } from './course';

export interface CalendarEventItem {
  course: Course;
  lesson: Lesson;
}

export interface ExportCalendarOptions {
  planId: string;
  planLabel: string;
  startDate: string; // DD/MM/YYYY or YYYY-MM-DD
  endDate: string; // DD/MM/YYYY or YYYY-MM-DD
  selectedEvents: CalendarEventItem[];
}

export interface GoogleSyncConfig {
  isEnabled: boolean;
  clientId?: string;
  accessToken?: string;
  lastSyncedAt?: string;
}

