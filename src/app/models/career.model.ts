import { Course } from './course';

export interface CareerIndexEntry {
  id: string;
  name: string;
  university?: string;
  file?: string;
}

export interface RawCourseData {
  id: number;
  name: string;
  year: number;
  q: number;
  cursarReqId: number[];
  aprobarReqId: number[];
  lessons: {
    id: string;
    professor: string;
    day: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface CareerPlan {
  id: string;
  name: string;
  university?: string;
  version?: string;
  courses: RawCourseData[];
}

export const EMPTY_CAREER_PLAN: CareerPlan = {
  id: 'empty-plan',
  name: 'Plan sin materias',
  university: 'N/A',
  version: '1.0.0',
  courses: [],
};

export function parseCareerPlanToCourses(plan: CareerPlan): Course[] {
  if (!plan || !Array.isArray(plan.courses)) return [];
  return plan.courses.map((c) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    q: c.q,
    status: 'pending',
    cursarReqId: c.cursarReqId.slice(),
    aprobarReqId: c.aprobarReqId.slice(),
    lessons: (c.lessons || []).map((l) => ({
      id: l.id,
      professor: l.professor,
      day: l.day,
      startTime: l.startTime,
      endTime: l.endTime,
    })),
  }));
}
