import { Injectable, effect } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Course, CourseStatus } from '../models/course';
import { COURSES_DATA } from '../data/courses.data';

export interface CourseStateEntry {
  status: CourseStatus;
  lessonStatuses: Record<string, CourseStatus>;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  // Layout per plan (which semester each subject is placed in)
  private coursesByPlanSignal = signal<Map<string, Course[]>>(new Map());
  // Single unified source of truth for course & lesson statuses — shared across all views
  private courseStateSignal = signal<Map<number, CourseStateEntry>>(new Map());
  private currentPlanIdSignal = signal<string>('1');
  private selectedIdsSignal = signal<Set<number>>(new Set());
  private hoveredCourseIdSignal = signal<number | null>(null);

  private readonly STORAGE_KEY = 'course-organizer-state';

  courses = computed(() => {
    return this.getCoursesForPlan(this.currentPlanIdSignal());
  });

  getCoursesForPlan(planId: string): Course[] {
    const rawCourses = this.coursesByPlanSignal().get(planId) ?? [];
    const stateMap = this.courseStateSignal();

    return rawCourses.map((course) => {
      const courseState = stateMap.get(course.id);
      const courseStatus = courseState?.status ?? 'pending';

      return {
        ...course,
        status: courseStatus,
        lessons: course.lessons.map((lesson) => ({
          ...lesson,
          status: courseState?.lessonStatuses[lesson.id] ?? courseStatus,
        })),
      };
    });
  }

  selectedIds = computed(() => this.selectedIdsSignal());
  hoveredCourseId = computed(() => this.hoveredCourseIdSignal());

  readonly hoveredRequiredSet = computed(() => {
    const hoveredId = this.hoveredCourseIdSignal();
    if (hoveredId === null) return new Set<number>();
    const course = this.getCourseById(hoveredId);
    if (!course) return new Set<number>();
    return new Set<number>(this.getRequiredCourseIds(course));
  });

  readonly hoveredUnlockedSet = computed(() => {
    const hoveredId = this.hoveredCourseIdSignal();
    if (hoveredId === null) return new Set<number>();
    return new Set<number>(this.getUnlockedCourseIds(hoveredId));
  });

  private readonly rawCourseByIdMap = computed(() => {
    const map = new Map<number, Course>();
    const courses = this.coursesByPlanSignal().get(this.currentPlanIdSignal()) ?? [];
    for (const c of courses) {
      map.set(c.id, c);
    }
    return map;
  });

  constructor() {
    const initialCourses = new Map<string, Course[]>();
    initialCourses.set('1', this.initializeCourses());
    this.coursesByPlanSignal.set(initialCourses);
    this.courseStateSignal.set(this.initializeCourseStates());

    this.loadState();

    effect(() => {
      this.coursesByPlanSignal();
      this.courseStateSignal();
      this.saveState();
    });
  }

  private currentRawCourses(): Course[] {
    const courses = this.coursesByPlanSignal().get(this.currentPlanIdSignal()) ?? [];
    const stateMap = this.courseStateSignal();
    return courses.map((c) => {
      const courseState = stateMap.get(c.id);
      const courseStatus = courseState?.status ?? 'pending';
      return {
        ...c,
        status: courseStatus,
        lessons: c.lessons.map((lesson) => ({
          ...lesson,
          status: courseState?.lessonStatuses[lesson.id] ?? courseStatus,
        })),
      };
    });
  }

  private setCurrentRawCourses(courses: Course[]): void {
    const planId = this.currentPlanIdSignal();
    const updated = new Map(this.coursesByPlanSignal());
    updated.set(planId, courses);
    this.coursesByPlanSignal.set(updated);
  }

  private initializeCourses(): Course[] {
    return COURSES_DATA.map((course) => ({
      ...course,
      status: 'pending' as CourseStatus,
      cursarReqId: course.cursarReqId.slice(),
      aprobarReqId: course.aprobarReqId.slice(),
      lessons: course.lessons.map((lesson) => ({ ...lesson })),
    }));
  }

  private initializeCourseStates(): Map<number, CourseStateEntry> {
    const states = new Map<number, CourseStateEntry>();
    COURSES_DATA.forEach((course) => {
      const lessonStatuses: Record<string, CourseStatus> = {};
      course.lessons.forEach((lesson) => {
        lessonStatuses[lesson.id] = 'pending';
      });
      states.set(course.id, {
        status: 'pending',
        lessonStatuses,
      });
    });
    return states;
  }

  private buildUnlockMap(): Map<number, Set<number>> {
    const map = new Map<number, Set<number>>();
    const courses = this.currentRawCourses();

    courses.forEach((course) => {
      map.set(course.id, new Set());
    });

    courses.forEach((target) => {
      const allReqs = [...new Set([...target.cursarReqId, ...target.aprobarReqId])];
      allReqs.forEach((reqId) => {
        map.get(reqId)?.add(target.id);
      });
    });

    return map;
  }

  getCourseById(id: number): Course | undefined {
    const raw = this.rawCourseByIdMap().get(id);
    if (!raw) return undefined;
    const courseState = this.courseStateSignal().get(id);
    const status = courseState?.status ?? 'pending';
    return {
      ...raw,
      status,
      lessons: raw.lessons.map((lesson) => ({
        ...lesson,
        status: courseState?.lessonStatuses[lesson.id] ?? status,
      })),
    };
  }

  getRequiredCourseIds(course: Course): number[] {
    return [...new Set([...course.cursarReqId, ...course.aprobarReqId])];
  }

  getUnlockedCourseIds(courseId: number): number[] {
    const unlockMap = this.buildUnlockMap();
    const byId = unlockMap.get(courseId);
    return byId ? Array.from(byId) : [];
  }

  private areRequirementsSatisfied(
    requiredIds: number[],
    requiredStatus: 'coursed' | 'approved',
    coursesList: Course[] = this.currentRawCourses(),
  ): boolean {
    return requiredIds.every((reqId) => {
      const reqCourse = coursesList.find((c) => c.id === reqId);
      if (!reqCourse) return false;

      if (requiredStatus === 'coursed') {
        return reqCourse.status === 'coursed' || reqCourse.status === 'approved';
      }
      return reqCourse.status === 'approved';
    });
  }

  private canSatisfyUpstreamRequirements(
    courseId: number,
    targetStatus: CourseStatus,
    coursesList: Course[] = this.currentRawCourses(),
  ): boolean {
    const course = coursesList.find((c) => c.id === courseId);
    if (!course) return false;

    if (targetStatus === 'pending') {
      return true; // Always can go back to pending upstream-wise
    }

    if (targetStatus === 'coursing' || targetStatus === 'coursed') {
      // 1. Direct cursarReqId must be at least 'coursed' or 'approved'
      const cursarReqMet = this.areRequirementsSatisfied(course.cursarReqId, 'coursed', coursesList);
      if (!cursarReqMet) return false;

      // 2. Nested aprobarReqId of prerequisites must be 'approved'
      return course.cursarReqId.every((reqId) => {
        const reqCourse = coursesList.find((c) => c.id === reqId);
        if (!reqCourse) return true;
        return this.areRequirementsSatisfied(reqCourse.aprobarReqId, 'approved', coursesList);
      });
    }

    if (targetStatus === 'approved') {
      // All aprobarReqId must be 'approved'
      return this.areRequirementsSatisfied(course.aprobarReqId, 'approved', coursesList);
    }

    return false;
  }

  canChangeStatusTo(courseId: number, targetStatus: CourseStatus): boolean {
    // 1. Check upstream prerequisite satisfaction for targetStatus
    if (!this.canSatisfyUpstreamRequirements(courseId, targetStatus)) {
      return false;
    }

    // 2. Check if downstream active dependent courses would be invalidated
    const currentCourses = this.currentRawCourses();
    const targetCourse = currentCourses.find((c) => c.id === courseId);
    if (!targetCourse || targetCourse.status === targetStatus) {
      return true;
    }

    // Simulate changing courseId's status to targetStatus
    const simulatedCourses = currentCourses.map((c) =>
      c.id === courseId ? { ...c, status: targetStatus } : c,
    );

    // Ensure all active non-pending dependent courses remain valid in their current status
    return simulatedCourses.every((c) => {
      if (c.id === courseId || c.status === 'pending') {
        return true;
      }
      return this.canSatisfyUpstreamRequirements(c.id, c.status, simulatedCourses);
    });
  }

  areAllRequirementsMet(course: Course): boolean {
    return this.canChangeStatusTo(course.id, 'coursing');
  }

  toggleCourseStatus(courseId: number): void {
    const course = this.getCourseById(courseId);
    if (!course) return;

    let nextStatus: CourseStatus;
    if (course.status === 'pending') {
      nextStatus = 'coursing';
    } else if (course.status === 'coursing') {
      nextStatus = 'coursed';
    } else if (course.status === 'coursed') {
      nextStatus = 'approved';
    } else {
      nextStatus = 'pending';
    }

    if (this.canChangeStatusTo(courseId, nextStatus)) {
      const stateMap = new Map(this.courseStateSignal());
      const existing = stateMap.get(courseId);

      const updatedLessonStatuses: Record<string, CourseStatus> = {
        ...(existing?.lessonStatuses ?? {}),
      };
      course.lessons.forEach((lesson) => {
        updatedLessonStatuses[lesson.id] = nextStatus;
      });

      stateMap.set(courseId, {
        status: nextStatus,
        lessonStatuses: updatedLessonStatuses,
      });
      this.courseStateSignal.set(stateMap);
    }
  }

  toggleLessonStatus(lessonId: string): void {
    const courses = this.currentRawCourses();
    const course = courses.find((c) => c.lessons.some((l) => l.id === lessonId));
    if (!course) return;

    const stateMap = new Map(this.courseStateSignal());
    const existing = stateMap.get(course.id) ?? {
      status: 'pending',
      lessonStatuses: {},
    };

    const oldLessonStatus = existing.lessonStatuses[lessonId] ?? existing.status ?? 'pending';
    let nextStatus: CourseStatus;
    if (oldLessonStatus === 'pending') {
      nextStatus = 'coursing';
    } else if (oldLessonStatus === 'coursing') {
      nextStatus = 'coursed';
    } else if (oldLessonStatus === 'coursed') {
      nextStatus = 'approved';
    } else {
      nextStatus = 'pending';
    }

    const updatedLessonStatuses: Record<string, CourseStatus> = {
      ...existing.lessonStatuses,
      [lessonId]: nextStatus,
    };

    const lessonStatusValues = course.lessons.map(
      (l) => updatedLessonStatuses[l.id] ?? 'pending',
    );
    const allSameStatus = lessonStatusValues.every((s) => s === lessonStatusValues[0]);
    const newCourseStatus = allSameStatus ? lessonStatusValues[0] : existing.status;

    stateMap.set(course.id, {
      status: newCourseStatus,
      lessonStatuses: updatedLessonStatuses,
    });
    this.courseStateSignal.set(stateMap);
  }

  toggleCourseSelection(courseId: number): void {
    const selected = new Set(this.selectedIdsSignal());
    if (selected.has(courseId)) {
      selected.delete(courseId);
    } else {
      selected.add(courseId);
    }
    this.selectedIdsSignal.set(selected);
  }

  setHoveredCourseId(courseId: number | null): void {
    this.hoveredCourseIdSignal.set(courseId);
  }

  reset(): void {
    this.courseStateSignal.set(this.initializeCourseStates());
    this.setCurrentRawCourses(this.initializeCourses());
    this.selectedIdsSignal.set(new Set());
  }

  setCurrentPlanId(planId: string): void {
    this.currentPlanIdSignal.set(planId);

    // Initialize per-plan layout if not present (statuses are shared, no copying needed)
    const coursesByPlan = this.coursesByPlanSignal();
    if (!coursesByPlan.has(planId)) {
      const updatedCoursesByPlan = new Map(coursesByPlan);
      updatedCoursesByPlan.set(planId, this.initializeCourses());
      this.coursesByPlanSignal.set(updatedCoursesByPlan);
    }
  }

  deletePlan(planId: string): void {
    const updatedCoursesByPlan = new Map(this.coursesByPlanSignal());
    updatedCoursesByPlan.delete(planId);
    this.coursesByPlanSignal.set(updatedCoursesByPlan);
  }

  getMoveBlockReason(lessonId: string, targetYear: number): string | null {
    const courses = this.currentRawCourses();
    const currentCourse = courses.find((c) => c.lessons.some((l) => l.id === lessonId));
    if (!currentCourse) return null;

    // Block if any dependent (course that requires this one) is already at the target year
    const overlappingDependent = courses.find(
      (c) =>
        c.year === targetYear &&
        (c.cursarReqId.includes(currentCourse.id) || c.aprobarReqId.includes(currentCourse.id)),
    );
    if (overlappingDependent) {
      return `No se puede mover "${currentCourse.name}" porque "${overlappingDependent.name}" la requiere y está en el mismo año`;
    }

    // Block if any prerequisite of this course is already at the target year
    const allReqIds = [...new Set([...currentCourse.cursarReqId, ...currentCourse.aprobarReqId])];
    const overlappingPrereq = courses.find(
      (c) => c.year === targetYear && allReqIds.includes(c.id),
    );
    if (overlappingPrereq) {
      return `No se puede mover "${currentCourse.name}" porque su requisito "${overlappingPrereq.name}" está en el mismo año`;
    }

    return null;
  }

  canMoveLessonToSemester(lessonId: string, targetYear: number): boolean {
    return this.getMoveBlockReason(lessonId, targetYear) === null;
  }

  moveLessonToSemester(lessonId: string, targetYear: number, targetQ: number): void {
    const courses = this.currentRawCourses();
    const currentCourse = courses.find((c) => c.lessons.some((l) => l.id === lessonId));

    if (!currentCourse) {
      console.warn(`Lesson ${lessonId} not found`);
      return;
    }

    if (currentCourse.year === targetYear && currentCourse.q === targetQ) {
      return;
    }

    const updatedCourses = courses.map((c) =>
      c.id === currentCourse.id ? { ...c, year: targetYear, q: targetQ } : c,
    );
    this.setCurrentRawCourses(updatedCourses);
  }

  private saveState(): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      const courseStatesObj: Record<string, CourseStateEntry> = {};
      this.courseStateSignal().forEach((val, key) => {
        courseStatesObj[key.toString()] = val;
      });
      const state = {
        coursesByPlan: this.serializeCoursesByPlan(this.coursesByPlanSignal()),
        courseStates: courseStatesObj,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save course state to localStorage:', error);
    }
  }

  private loadState(): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const state = JSON.parse(stored);

      if (state.coursesByPlan) {
        this.coursesByPlanSignal.set(this.deserializeCoursesByPlan(state.coursesByPlan));
      }

      if (state.courseStates) {
        const loadedMap = new Map<number, CourseStateEntry>();
        Object.entries(state.courseStates).forEach(([k, v]) => {
          const numericId = Number(k);
          if (!isNaN(numericId)) {
            loadedMap.set(numericId, v as CourseStateEntry);
          }
        });
        this.courseStateSignal.set(loadedMap);
      } else if (state.courseStatuses || state.lessonStatuses) {
        // Legacy migration from separate courseStatuses and lessonStatuses
        const migratedMap = this.initializeCourseStates();
        const legacyCourseStatuses: Record<string, CourseStatus> = state.courseStatuses ?? {};
        const legacyLessonStatuses: Record<string, CourseStatus> = state.lessonStatuses ?? {};

        migratedMap.forEach((entry, courseId) => {
          const targetCourse = COURSES_DATA.find((c) => c.id === courseId);
          const legacyKey = targetCourse ? targetCourse.name : courseId.toString();
          const cStatus = legacyCourseStatuses[legacyKey] ?? 'pending';
          const lStatuses: Record<string, CourseStatus> = { ...entry.lessonStatuses };
          Object.keys(lStatuses).forEach((lId) => {
            if (legacyLessonStatuses[lId]) {
              lStatuses[lId] = legacyLessonStatuses[lId];
            } else {
              lStatuses[lId] = cStatus;
            }
          });
          migratedMap.set(courseId, {
            status: cStatus,
            lessonStatuses: lStatuses,
          });
        });
        this.courseStateSignal.set(migratedMap);
      }
    } catch (error) {
      console.warn('Failed to load course state from localStorage:', error);
    }
  }

  private serializeCoursesByPlan(coursesByPlan: Map<string, Course[]>): Record<string, Course[]> {
    const result: Record<string, Course[]> = {};
    coursesByPlan.forEach((courses, planId) => {
      result[planId] = courses;
    });
    return result;
  }

  private deserializeCoursesByPlan(data: Record<string, Course[]>): Map<string, Course[]> {
    const coursesByPlan = new Map<string, Course[]>();
    Object.entries(data).forEach(([planId, courses]) => {
      coursesByPlan.set(planId, courses as Course[]);
    });
    return coursesByPlan;
  }
}
