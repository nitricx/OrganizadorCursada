import { CourseStatus, DayOfWeek } from './course';

/**
 * Public, immutable PlanManifest asset schema.
 * Defines the static curriculum structure of a degree (Base Degree Module).
 * Stripped of all user lifecycle states (status, grades, user notes, semester moves).
 */
export interface CourseManifest {
  id: string; // Canonical course ID (e.g. 'urn:course:unrn:audiovisual:pa1' or 'pa1')
  name: string;
  year: number;
  q: number; // Quarter/Semester: 1, 2, or 3
  cursarReq: string[]; // Prerequisite course IDs or exact names required to course
  aprobarReq: string[]; // Prerequisite course IDs or exact names required to approve
}

export interface PlanManifest {
  id: string; // Canonical URN/UUID (e.g. 'urn:orgcursada:unrn:audiovisual:v1')
  name: string; // e.g. "Licenciatura en Diseño Audiovisual"
  university: string; // e.g. "UNRN"
  faculty?: string; // e.g. "Escuela de Artes y Medios"
  version: string; // e.g. "1.2.0"
  forkOf?: string; // Optional URN of parent manifest if this is a custom fork
  courses: CourseManifest[];
}

/**
 * Public, semi-static CommissionPack asset schema (Micro Addon).
 * Defines commission schedule options and professor lists for a given term.
 */
export interface LessonSchedule {
  id: string; // e.g. 'COMM-1'
  professor: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface CommissionPack {
  id: string; // e.g. 'comm_unrn_audiovisual_2024_q1'
  planId: string; // Associated PlanManifest URN
  term: string; // e.g. "2024-Q1"
  professors: Record<string, string[]>; // courseId -> professor names list
  lessons: Record<string, LessonSchedule[]>; // courseId -> commission lessons list
}

/**
 * Custom prerequisite overrides specified by the local user.
 */
export interface CustomPrereqDelta {
  addCursar?: string[];
  removeCursar?: string[];
  addAprobar?: string[];
  removeAprobar?: string[];
}

/**
 * Private, volatile UserProgressOverlay local state schema.
 * Stored exclusively in local browser storage (localStorage/IndexedDB).
 * NEVER transmitted across the network.
 */
export interface UserProgressOverlay {
  planId: string;
  courseStatuses: Record<string, CourseStatus>; // courseId -> status
  semesterOverrides: Record<string, number>; // courseId -> target semester index
  selectedLessons: Record<string, string[]>; // courseId -> selected lesson IDs
  userNotes: Record<string, string>; // courseId -> personal notes
  customPrereqDeltas?: Record<string, CustomPrereqDelta>; // courseId -> custom prereq deltas
}

/**
 * Rebase conflict metadata when an upstream PlanManifest updates.
 */
export interface RebaseConflict {
  courseId: string;
  courseName: string;
  type: 'prerequisite_modified' | 'course_removed' | 'semester_changed';
  description: string;
  oldValue?: any;
  newValue?: any;
}
