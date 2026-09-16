import { Course, CourseStatus, Lesson } from '../models/course';
import { Plan, SemesterSlot } from '../services/plan.service';
import { CourseStateEntry } from '../services/course.service';

const VALID_COURSE_STATUSES = new Set<CourseStatus>(['pending', 'coursing', 'coursed', 'approved']);

export function isValidCourseStatus(val: unknown): val is CourseStatus {
  return typeof val === 'string' && VALID_COURSE_STATUSES.has(val as CourseStatus);
}

export function isValidPlan(val: unknown): val is Plan {
  if (typeof val !== 'object' || val === null) return false;
  const p = val as Partial<Plan>;
  return (
    typeof p.id === 'string' &&
    p.id.trim() !== '' &&
    typeof p.label === 'string' &&
    p.label.trim() !== ''
  );
}

export function sanitizePlans(parsed: unknown, defaultPlans: Plan[]): Plan[] {
  if (!Array.isArray(parsed)) {
    return defaultPlans;
  }
  const validPlans = parsed.filter(isValidPlan);
  const deduplicated = validPlans.filter(
    (plan, index, self) => self.findIndex((p) => p.id === plan.id) === index,
  );
  return deduplicated.length > 0 ? deduplicated : defaultPlans;
}

export function isValidSemesterSlot(val: unknown): val is SemesterSlot {
  if (typeof val !== 'object' || val === null) return false;
  const s = val as Partial<SemesterSlot>;
  const validId = typeof s.id === 'string' && s.id.trim() !== '';
  const validYear = typeof s.courseYear === 'number' && !Number.isNaN(s.courseYear);
  const validQ = typeof s.courseQ === 'number' && !Number.isNaN(s.courseQ);
  const validStartDate = s.startDate === undefined || typeof s.startDate === 'string';
  const validEndDate = s.endDate === undefined || typeof s.endDate === 'string';
  return validId && validYear && validQ && validStartDate && validEndDate;
}

export function sanitizeSemesterSlots(parsed: unknown): SemesterSlot[] {
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isValidSemesterSlot);
}

export function sanitizeStartingYear(parsed: unknown, defaultYear: number): number {
  if (typeof parsed === 'number' && !Number.isNaN(parsed) && parsed >= 1900 && parsed <= 2100) {
    return parsed;
  }
  if (typeof parsed === 'string') {
    const num = Number(parsed);
    if (!Number.isNaN(num) && num >= 1900 && num <= 2100) {
      return num;
    }
  }
  return defaultYear;
}

export function isValidLesson(val: unknown): val is Lesson {
  if (typeof val !== 'object' || val === null) return false;
  const l = val as Partial<Lesson>;
  const validId = typeof l.id === 'string' && l.id.trim() !== '';
  const validProf = typeof l.professor === 'string';
  const validDay = typeof l.day === 'number' && !Number.isNaN(l.day) && l.day >= 0 && l.day <= 6;
  const validStart = typeof l.startTime === 'string';
  const validEnd = typeof l.endTime === 'string';
  const validStatus = l.status === undefined || isValidCourseStatus(l.status);
  return validId && validProf && validDay && validStart && validEnd && validStatus;
}

function isValidCourseMetadata(c: Partial<Course>): boolean {
  const validId = typeof c.id === 'number' && !Number.isNaN(c.id);
  const validName = typeof c.name === 'string' && c.name.trim() !== '';
  const validYear = typeof c.year === 'number' && !Number.isNaN(c.year);
  const validQ = typeof c.q === 'number' && !Number.isNaN(c.q);
  const validStatus = isValidCourseStatus(c.status);
  return validId && validName && validYear && validQ && validStatus;
}

function isValidCourseRequirements(c: Partial<Course>): boolean {
  const validCursarReq =
    Array.isArray(c.cursarReqId) &&
    c.cursarReqId.every((id) => typeof id === 'number' && !Number.isNaN(id));
  const validAprobarReq =
    Array.isArray(c.aprobarReqId) &&
    c.aprobarReqId.every((id) => typeof id === 'number' && !Number.isNaN(id));
  const validLessons = Array.isArray(c.lessons) && c.lessons.every(isValidLesson);
  return validCursarReq && validAprobarReq && validLessons;
}

export function isValidCourse(val: unknown): val is Course {
  if (typeof val !== 'object' || val === null) return false;
  const c = val as Partial<Course>;
  return isValidCourseMetadata(c) && isValidCourseRequirements(c);
}

export function sanitizeCourseStateEntry(val: unknown): CourseStateEntry {
  if (typeof val !== 'object' || val === null) {
    return { status: 'pending', lessonStatuses: {}, selectedLessonId: null };
  }
  const entry = val as Partial<CourseStateEntry>;
  const status: CourseStatus = isValidCourseStatus(entry.status) ? entry.status : 'pending';
  const lessonStatuses: Record<string, CourseStatus> = {};

  if (typeof entry.lessonStatuses === 'object' && entry.lessonStatuses !== null) {
    Object.entries(entry.lessonStatuses).forEach(([lId, lStat]) => {
      lessonStatuses[lId] = isValidCourseStatus(lStat) ? lStat : status;
    });
  }

  const selectedLessonId =
    typeof entry.selectedLessonId === 'string' && entry.selectedLessonId.trim() !== ''
      ? entry.selectedLessonId
      : null;

  return { status, lessonStatuses, selectedLessonId };
}

export function sanitizeCourseStatesMap(parsed: unknown): Map<number, CourseStateEntry> {
  const map = new Map<number, CourseStateEntry>();
  if (typeof parsed !== 'object' || parsed === null) {
    return map;
  }
  Object.entries(parsed).forEach(([k, v]) => {
    const numericId = Number(k);
    if (!Number.isNaN(numericId)) {
      map.set(numericId, sanitizeCourseStateEntry(v));
    }
  });
  return map;
}

export function sanitizeCoursesByPlan(parsed: unknown): Map<string, Course[]> {
  const map = new Map<string, Course[]>();
  if (typeof parsed !== 'object' || parsed === null) {
    return map;
  }
  Object.entries(parsed).forEach(([planId, courses]) => {
    if (Array.isArray(courses)) {
      const validCourses = courses.filter(isValidCourse);
      map.set(planId, validCourses);
    }
  });
  return map;
}

function isKeyOrphaned(
  key: string,
  validPlanIds: Set<string>,
  validCareerIds: Set<string>,
): boolean {
  const prefixes = [
    { prefix: 'plan-semesters-', validSet: validPlanIds },
    { prefix: 'plan-starting-year-', validSet: validPlanIds },
    { prefix: 'course-organizer-state-', validSet: validCareerIds },
    { prefix: 'custom-career-', validSet: validCareerIds },
  ];

  for (const { prefix, validSet } of prefixes) {
    if (key.startsWith(prefix)) {
      const id = key.replace(prefix, '');
      return !validSet.has(id);
    }
  }
  return false;
}

export function cleanupOrphanedStorageKeys(
  activePlanIds: string[],
  activeCareerIds: string[],
): void {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return;

    const validPlanIds = new Set(activePlanIds);
    const validCareerIds = new Set(['lic-diseno-audiovisual', ...activeCareerIds]);
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isKeyOrphaned(key, validPlanIds, validCareerIds)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}
