import { CourseStatus } from '../models/course';

export interface CourseStatusConfig {
  key: CourseStatus;
  label: string;
  tag: string;
  symbol: string;
  bg: string;
  color: string;
  borderColor: string;
}

export const COURSE_STATUS_CONFIG: Record<CourseStatus, CourseStatusConfig> = {
  pending: {
    key: 'pending',
    label: 'Pendiente',
    tag: '',
    symbol: '',
    bg: '#e8e7e0',
    color: '#1a1a1a',
    borderColor: '#888888',
  },
  coursing: {
    key: 'coursing',
    label: 'Cursando',
    tag: 'cursando',
    symbol: '',
    bg: '#fff8e1',
    color: '#5d4e06',
    borderColor: '#d4b856',
  },
  coursed: {
    key: 'coursed',
    label: 'Cursada',
    tag: 'cursada',
    symbol: '',
    bg: '#e6f1fb',
    color: '#042c53',
    borderColor: '#185fa5',
  },
  approved: {
    key: 'approved',
    label: 'Aprobada',
    tag: 'aprobada',
    symbol: '',
    bg: '#e1f5ee',
    color: '#04342c',
    borderColor: '#0f6e56',
  },
};

export const COURSE_STATUS_LIST: CourseStatusConfig[] = [
  COURSE_STATUS_CONFIG.pending,
  COURSE_STATUS_CONFIG.coursing,
  COURSE_STATUS_CONFIG.coursed,
  COURSE_STATUS_CONFIG.approved,
];

export function getCourseStatusConfig(status: CourseStatus): CourseStatusConfig {
  return COURSE_STATUS_CONFIG[status] ?? COURSE_STATUS_CONFIG.pending;
}

export function getCourseStatusLabel(status: CourseStatus): string {
  return getCourseStatusConfig(status).label;
}

export function getCourseStatusTag(status: CourseStatus): string {
  return getCourseStatusConfig(status).tag;
}
