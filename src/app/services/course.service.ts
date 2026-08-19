import { Injectable, effect, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Course, CourseStatus } from '../models/course';
import { AUDIOVISUAL_COURSES_DATA } from '../data/courses.data';
import { CareerService } from './career.service';
import { CareerPlan } from '../models/career.model';
import {
  sanitizeCoursesByPlan,
  sanitizeCourseStatesMap,
} from '../utils/storage-sanitizer.utils';

import { AuthService } from './auth.service';
import { FirestoreSyncService, UserCareerStateDoc } from './firestore-sync.service';

export interface CourseStateEntry {
  status: CourseStatus;
  lessonStatuses: Record<string, CourseStatus>;
  selectedLessonId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private careerService = inject(CareerService, { optional: true });
  private authService = inject(AuthService, { optional: true });
  private firestoreSync = inject(FirestoreSyncService, { optional: true });

  // Layout per plan (which semester each subject is placed in)
  private coursesByPlanSignal = signal<Map<string, Course[]>>(new Map());
  // Single unified source of truth for course & lesson statuses — shared across all views
  private courseStateSignal = signal<Map<number, CourseStateEntry>>(new Map());
  private currentPlanIdSignal = signal<string>('1');
  private activeCareerIdSignal = signal<string>('lic-diseno-audiovisual');
  private selectedIdsSignal = signal<Set<number>>(new Set());
  private hoveredCourseIdSignal = signal<number | null>(null);

  private get storageKey(): string {
    return `course-organizer-state-${this.activeCareerIdSignal()}`;
  }

  courses = computed(() => {
    return this.getCoursesForPlan(this.currentPlanIdSignal());
  });

  getCoursesForPlan(planId: string): Course[] {
    const rawCourses = this.coursesByPlanSignal().get(planId) ?? [];
    const stateMap = this.courseStateSignal();

    return rawCourses.map((course) => {
      const courseState = stateMap.get(course.id);
      const courseStatus = courseState?.status ?? 'pending';
      const selectedLessonId = courseState?.selectedLessonId ?? null;

      return {
        ...course,
        status: courseStatus,
        selectedLessonId,
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

  readonly unlockMap = computed<Map<number, Set<number>>>(() => {
    const map = new Map<number, Set<number>>();
    const rawCourses = this.coursesByPlanSignal().get(this.currentPlanIdSignal()) ?? [];

    rawCourses.forEach((course) => {
      map.set(course.id, new Set());
    });

    rawCourses.forEach((target) => {
      const allReqs = new Set([...target.cursarReqId, ...target.aprobarReqId]);
      allReqs.forEach((reqId) => {
        map.get(reqId)?.add(target.id);
      });
    });

    return map;
  });

  readonly hoveredUnlockedSet = computed(() => {
    const hoveredId = this.hoveredCourseIdSignal();
    if (hoveredId === null) return new Set<number>();
    const byId = this.unlockMap().get(hoveredId);
    return byId ? new Set<number>(byId) : new Set<number>();
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

    if (this.careerService) {
      effect(() => {
        const activeCareer = this.careerService?.activeCareer();
        if (activeCareer) {
          this.setCareerPlan(activeCareer);
        }
      });
    }

    effect(() => {
      this.coursesByPlanSignal();
      this.courseStateSignal();
      this.saveState();
    });

    if (this.authService && this.firestoreSync) {
      effect(() => {
        const user = this.authService?.userSignal();
        const careerId = this.activeCareerIdSignal();
        if (user && this.firestoreSync) {
          const sub = this.firestoreSync.getUserCareerData$(user.uid, careerId).subscribe((cloudDoc) => {
            if (cloudDoc) {
              this.applyCloudData(cloudDoc);
            } else {
              // First time login: push existing local state to cloud
              this.syncToCloud(user.uid, careerId);
            }
          });
          return () => sub.unsubscribe();
        }
        return;
      });
    }
  }

  setCareerPlan(careerPlan: CareerPlan): void {
    this.activeCareerIdSignal.set(careerPlan.id);
    const newCourses: Course[] = careerPlan.courses.map((c) => ({
      id: c.id,
      name: c.name,
      year: c.year,
      q: c.q,
      status: 'pending' as CourseStatus,
      cursarReqId: c.cursarReqId.slice(),
      aprobarReqId: c.aprobarReqId.slice(),
      lessons: c.lessons.map((l) => ({ ...l })),
    }));

    const updatedByPlan = new Map<string, Course[]>();
    updatedByPlan.set(this.currentPlanIdSignal(), newCourses);
    this.coursesByPlanSignal.set(updatedByPlan);

    const initialStates = new Map<number, CourseStateEntry>();
    newCourses.forEach((course) => {
      const lessonStatuses: Record<string, CourseStatus> = {};
      course.lessons.forEach((l) => {
        lessonStatuses[l.id] = 'pending';
      });
      initialStates.set(course.id, {
        status: 'pending',
        lessonStatuses,
        selectedLessonId: null,
      });
    });
    this.courseStateSignal.set(initialStates);
    this.selectedIdsSignal.set(new Set());

    this.loadState(careerPlan);
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
    return AUDIOVISUAL_COURSES_DATA.map((course) => ({
      ...course,
      status: 'pending' as CourseStatus,
      cursarReqId: course.cursarReqId.slice(),
      aprobarReqId: course.aprobarReqId.slice(),
      lessons: course.lessons.map((lesson) => ({ ...lesson })),
    }));
  }

  private initializeCourseStates(): Map<number, CourseStateEntry> {
    const states = new Map<number, CourseStateEntry>();
    AUDIOVISUAL_COURSES_DATA.forEach((course) => {
      const lessonStatuses: Record<string, CourseStatus> = {};
      course.lessons.forEach((lesson) => {
        lessonStatuses[lesson.id] = 'pending';
      });
      states.set(course.id, {
        status: 'pending',
        lessonStatuses,
        selectedLessonId: null,
      });
    });
    return states;
  }

  getCourseById(id: number): Course | undefined {
    const raw = this.rawCourseByIdMap().get(id);
    if (!raw) return undefined;
    const courseState = this.courseStateSignal().get(id);
    const status = courseState?.status ?? 'pending';
    const selectedLessonId = courseState?.selectedLessonId ?? null;
    return {
      ...raw,
      status,
      selectedLessonId,
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
    const byId = this.unlockMap().get(courseId);
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

  setSelectedLessonForCourse(courseId: number, lessonId: string | null): void {
    const course = this.getCourseById(courseId);
    if (!course) return;

    const stateMap = new Map(this.courseStateSignal());
    const existing = stateMap.get(courseId) ?? {
      status: 'pending',
      lessonStatuses: {},
      selectedLessonId: null,
    };

    const updatedLessonStatuses: Record<string, CourseStatus> = { ...existing.lessonStatuses };

    if (lessonId) {
      const targetStatus = existing.status === 'pending' ? 'coursing' : existing.status;
      course.lessons.forEach((l) => {
        if (l.id === lessonId) {
          updatedLessonStatuses[l.id] = targetStatus;
        } else {
          updatedLessonStatuses[l.id] = 'pending';
        }
      });
    }

    stateMap.set(courseId, {
      ...existing,
      selectedLessonId: lessonId,
      lessonStatuses: updatedLessonStatuses,
    });
    this.courseStateSignal.set(stateMap);
  }

  getSelectedLessonId(courseId: number): string | null {
    const entry = this.courseStateSignal().get(courseId);
    return entry?.selectedLessonId ?? null;
  }

  toggleCourseStatus(courseId: number, targetLessonId?: string | null): void {
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

      let selectedLessonId = targetLessonId !== undefined ? targetLessonId : existing?.selectedLessonId ?? null;
      if (nextStatus === 'coursing') {
        if (!selectedLessonId && course.lessons.length > 0) {
          selectedLessonId = course.lessons[0].id;
        }
      } else if (nextStatus === 'pending') {
        selectedLessonId = null;
      }

      const updatedLessonStatuses: Record<string, CourseStatus> = {};
      course.lessons.forEach((lesson) => {
        if (nextStatus === 'coursing') {
          updatedLessonStatuses[lesson.id] = lesson.id === selectedLessonId ? 'coursing' : 'pending';
        } else {
          updatedLessonStatuses[lesson.id] = nextStatus;
        }
      });

      stateMap.set(courseId, {
        status: nextStatus,
        lessonStatuses: updatedLessonStatuses,
        selectedLessonId,
      });
      this.courseStateSignal.set(stateMap);
    }
  }

  setCourseStatus(courseId: number, targetStatus: CourseStatus): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    if (!this.canChangeStatusTo(courseId, targetStatus)) {
      return false;
    }

    const stateMap = new Map(this.courseStateSignal());
    const existing = stateMap.get(courseId);

    let selectedLessonId = existing?.selectedLessonId ?? null;
    if (targetStatus === 'coursing') {
      if (!selectedLessonId && course.lessons.length > 0) {
        selectedLessonId = course.lessons[0].id;
      }
    } else if (targetStatus === 'pending') {
      selectedLessonId = null;
    }

    const updatedLessonStatuses: Record<string, CourseStatus> = {};
    course.lessons.forEach((lesson) => {
      if (targetStatus === 'coursing') {
        updatedLessonStatuses[lesson.id] = lesson.id === selectedLessonId ? 'coursing' : 'pending';
      } else {
        updatedLessonStatuses[lesson.id] = targetStatus;
      }
    });

    stateMap.set(courseId, {
      status: targetStatus,
      lessonStatuses: updatedLessonStatuses,
      selectedLessonId,
    });
    this.courseStateSignal.set(stateMap);
    return true;
  }

  toggleLessonStatus(lessonId: string): void {
    const courses = this.currentRawCourses();
    const course = courses.find((c) => c.lessons.some((l) => l.id === lessonId));
    if (!course) return;

    const stateMap = new Map(this.courseStateSignal());
    const existing = stateMap.get(course.id) ?? {
      status: 'pending',
      lessonStatuses: {},
      selectedLessonId: null,
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

    let selectedLessonId = existing.selectedLessonId ?? null;
    if (nextStatus === 'coursing') {
      selectedLessonId = lessonId;
      course.lessons.forEach((l) => {
        if (l.id !== lessonId) {
          updatedLessonStatuses[l.id] = 'pending';
        }
      });
    }

    const lessonStatusValues = course.lessons.map(
      (l) => updatedLessonStatuses[l.id] ?? 'pending',
    );
    const anyCoursing = lessonStatusValues.some((s) => s === 'coursing');
    const allSameStatus = lessonStatusValues.every((s) => s === lessonStatusValues[0]);
    const newCourseStatus = anyCoursing
      ? 'coursing'
      : allSameStatus
        ? lessonStatusValues[0]
        : existing.status;

    stateMap.set(course.id, {
      status: newCourseStatus,
      lessonStatuses: updatedLessonStatuses,
      selectedLessonId,
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

  private syncToCloud(uid: string, careerId: string): void {
    if (!this.firestoreSync) return;
    const courseStatesObj: Record<string, CourseStateEntry> = {};
    this.courseStateSignal().forEach((val, key) => {
      courseStatesObj[key.toString()] = val;
    });
    this.firestoreSync.saveUserCareerData(uid, careerId, {
      coursesByPlan: this.serializeCoursesByPlan(this.coursesByPlanSignal()),
      courseStates: courseStatesObj,
    });
  }

  private applyCloudData(data: UserCareerStateDoc): void {
    if (data.coursesByPlan) {
      const sanitizedByPlan = sanitizeCoursesByPlan(data.coursesByPlan);
      if (sanitizedByPlan.size > 0) {
        this.coursesByPlanSignal.set(sanitizedByPlan);
      }
    }
    if (data.courseStates) {
      const loadedMap = sanitizeCourseStatesMap(data.courseStates);
      this.courseStateSignal.set(loadedMap);
    }
  }

  private saveState(): void {
    try {
      const courseStatesObj: Record<string, CourseStateEntry> = {};
      this.courseStateSignal().forEach((val, key) => {
        courseStatesObj[key.toString()] = val;
      });
      const state = {
        coursesByPlan: this.serializeCoursesByPlan(this.coursesByPlanSignal()),
        courseStates: courseStatesObj,
      };

      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(state));
      }

      const user = this.authService?.userSignal();
      if (user && this.firestoreSync) {
        this.syncToCloud(user.uid, this.activeCareerIdSignal());
      }
    } catch (error) {
      console.warn('Failed to save course state:', error);
    }
  }

  private loadState(activePlan?: CareerPlan): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      let stored = localStorage.getItem(this.storageKey);
      if (!stored && this.activeCareerIdSignal() === 'lic-diseno-audiovisual') {
        stored = localStorage.getItem('course-organizer-state');
      }
      if (!stored) return;

      const state = JSON.parse(stored);
      if (typeof state !== 'object' || state === null) return;

      const planToUse = activePlan ?? this.careerService?.activeCareer();

      if (state.coursesByPlan) {
        const sanitizedByPlan = sanitizeCoursesByPlan(state.coursesByPlan);
        if (sanitizedByPlan.size > 0) {
          if (planToUse && Array.isArray(planToUse.courses)) {
            const reconciled = this.reconcileCoursesByPlan(sanitizedByPlan, planToUse.courses);
            this.coursesByPlanSignal.set(reconciled);
          } else {
            this.coursesByPlanSignal.set(sanitizedByPlan);
          }
        }
      }

      if (state.courseStates) {
        const loadedMap = sanitizeCourseStatesMap(state.courseStates);
        if (planToUse && Array.isArray(planToUse.courses)) {
          planToUse.courses.forEach((c) => {
            if (!loadedMap.has(c.id)) {
              const lessonStatuses: Record<string, CourseStatus> = {};
              c.lessons.forEach((l) => {
                lessonStatuses[l.id] = 'pending';
              });
              loadedMap.set(c.id, {
                status: 'pending',
                lessonStatuses,
                selectedLessonId: null,
              });
            }
          });
        }
        this.courseStateSignal.set(loadedMap);
      } else if (state.courseStatuses || state.lessonStatuses) {
        // Legacy migration from separate courseStatuses and lessonStatuses
        const migratedMap = this.initializeCourseStates();
        const legacyCourseStatuses: Record<string, CourseStatus> = state.courseStatuses ?? {};
        const legacyLessonStatuses: Record<string, CourseStatus> = state.lessonStatuses ?? {};

        migratedMap.forEach((entry, courseId) => {
          const targetCourse = AUDIOVISUAL_COURSES_DATA.find((c) => c.id === courseId);
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

  private reconcileCoursesByPlan(
    storedByPlan: Map<string, Course[]>,
    canonicalCourses: { id: number; name: string; year: number; q: number; cursarReqId: number[]; aprobarReqId: number[]; lessons: any[] }[]
  ): Map<string, Course[]> {
    const resultMap = new Map<string, Course[]>();
    const canonicalMap = new Map<number, { id: number; name: string; year: number; q: number; cursarReqId: number[]; aprobarReqId: number[]; lessons: any[] }>();
    canonicalCourses.forEach((c) => canonicalMap.set(c.id, c));

    storedByPlan.forEach((storedCourses, planId) => {
      const storedIds = new Set<number>();
      const reconciledCourses: Course[] = [];

      // 1. Keep stored courses that exist in canonical list, updating metadata
      storedCourses.forEach((stored) => {
        const canonical = canonicalMap.get(stored.id);
        if (canonical) {
          storedIds.add(stored.id);
          reconciledCourses.push({
            ...stored,
            name: canonical.name,
            cursarReqId: canonical.cursarReqId.slice(),
            aprobarReqId: canonical.aprobarReqId.slice(),
            lessons: canonical.lessons.map((l) => ({ ...l })),
          });
        }
      });

      // 2. Add missing canonical courses that were not present in stored
      canonicalCourses.forEach((canonical) => {
        if (!storedIds.has(canonical.id)) {
          reconciledCourses.push({
            id: canonical.id,
            name: canonical.name,
            year: canonical.year,
            q: canonical.q,
            status: 'pending' as CourseStatus,
            cursarReqId: canonical.cursarReqId.slice(),
            aprobarReqId: canonical.aprobarReqId.slice(),
            lessons: canonical.lessons.map((l) => ({ ...l })),
          });
        }
      });

      resultMap.set(planId, reconciledCourses);
    });

    const currentPlanId = this.currentPlanIdSignal();
    if (!resultMap.has(currentPlanId)) {
      resultMap.set(
        currentPlanId,
        canonicalCourses.map((c) => ({
          id: c.id,
          name: c.name,
          year: c.year,
          q: c.q,
          status: 'pending' as CourseStatus,
          cursarReqId: c.cursarReqId.slice(),
          aprobarReqId: c.aprobarReqId.slice(),
          lessons: c.lessons.map((l) => ({ ...l })),
        }))
      );
    }

    return resultMap;
  }

  private serializeCoursesByPlan(coursesByPlan: Map<string, Course[]>): Record<string, Course[]> {
    const result: Record<string, Course[]> = {};
    coursesByPlan.forEach((courses, planId) => {
      result[planId] = courses;
    });
    return result;
  }

  private deserializeCoursesByPlan(data: unknown): Map<string, Course[]> {
    return sanitizeCoursesByPlan(data);
  }
}
