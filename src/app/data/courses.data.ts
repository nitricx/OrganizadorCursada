import { Course } from '../models/course';
import { CareerPlan } from '../models/career.model';
import audiovisualPlanJson from '../../../public/careers/audiovisual.json';
import sistemasPlanJson from '../../../public/careers/sistemas.json';

/** Registry of built-in career plans bundled for synchronous fallback */
export const BUILTIN_CAREER_PLANS: Record<string, CareerPlan> = {
  'lic-diseno-audiovisual': audiovisualPlanJson as unknown as CareerPlan,
  'ing-sistemas': sistemasPlanJson as unknown as CareerPlan,
};

export const DEFAULT_CAREER_ID = 'lic-diseno-audiovisual';
export const DEFAULT_CAREER_PLAN: CareerPlan = BUILTIN_CAREER_PLANS[DEFAULT_CAREER_ID];

/** Converts a Raw CareerPlan into domain Course entities */
export function parseCareerPlanToCourses(plan: CareerPlan): Course[] {
  return plan.courses.map((c) => ({
    id: c.id,
    name: c.name,
    year: c.year,
    q: c.q,
    status: 'pending',
    cursarReqId: c.cursarReqId.slice(),
    aprobarReqId: c.aprobarReqId.slice(),
    lessons: c.lessons.map((l) => ({
      id: l.id,
      professor: l.professor,
      day: l.day,
      startTime: l.startTime,
      endTime: l.endTime,
    })),
  }));
}

export function getBuiltinCareerPlan(careerId: string): CareerPlan | undefined {
  return BUILTIN_CAREER_PLANS[careerId];
}
