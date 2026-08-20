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
    bg: '#f0f4f8',
    color: '#073b4c',
    borderColor: '#073b4c',
  },
  coursing: {
    key: 'coursing',
    label: 'Cursando',
    tag: 'cursando',
    symbol: '',
    bg: '#fffbeb',
    color: '#7c2d12',
    borderColor: '#ffd166',
  },
  coursed: {
    key: 'coursed',
    label: 'Cursada',
    tag: 'cursada',
    symbol: '',
    bg: '#eef2ff',
    color: '#3730a3',
    borderColor: '#6366f1',
  },
  approved: {
    key: 'approved',
    label: 'Aprobada',
    tag: 'aprobada',
    symbol: '',
    bg: '#e6fbf5',
    color: '#044e3a',
    borderColor: '#06d6a0',
  },
};

export const AVAILABLE_STATUS_CONFIG: CourseStatusConfig = {
  key: 'pending',
  label: 'Disponible para cursar',
  tag: 'disponible',
  symbol: '',
  bg: '#e0f2fe',
  color: '#0369a1',
  borderColor: '#118ab2',
};

export const REQ_STATUS_CONFIG: CourseStatusConfig = {
  key: 'pending',
  label: 'Requisito',
  tag: 'requisito',
  symbol: '',
  bg: '#fde8ed',
  color: '#9f1239',
  borderColor: '#ef476f',
};

export const UNLOCKS_STATUS_CONFIG: CourseStatusConfig = {
  key: 'pending',
  label: 'Desbloquea',
  tag: 'desbloquea',
  symbol: '',
  bg: '#e6fbf5',
  color: '#044e3a',
  borderColor: '#06d6a0',
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
