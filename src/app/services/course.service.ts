import { Injectable, effect } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Course, CourseStatus } from '../models/course';
import { COURSES_DATA } from '../data/courses.data';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  // Layout per plan (which semester each subject is placed in)
  private coursesByPlanSignal = signal<Map<string, Course[]>>(new Map());
  // Single source of truth for statuses — shared across all views
  private courseStatusesSignal = signal<Map<string, CourseStatus>>(new Map());
  private lessonStatusesSignal = signal<Map<string, CourseStatus>>(new Map());
  private currentPlanIdSignal = signal<string>('1');
  private selectedIdsSignal = signal<Set<string>>(new Set());
  private hoveredCourseIdSignal = signal<string | null>(null);

  private readonly STORAGE_KEY = 'course-organizer-state';

  courses = computed(() => {
    return this.getCoursesForPlan(this.currentPlanIdSignal());
  });

  getCoursesForPlan(planId: string): Course[] {
    const rawCourses = this.coursesByPlanSignal().get(planId) ?? [];
    const courseStatuses = this.courseStatusesSignal();
    const lessonStatuses = this.lessonStatusesSignal();

    return rawCourses.map((course) => ({
      ...course,
      status: (courseStatuses.get(course.id) ?? 'pending') as CourseStatus,
      lessons: course.lessons.map((lesson) => ({
        ...lesson,
        status: (lessonStatuses.get(lesson.id) ?? 'pending') as CourseStatus,
      })),
    }));
  }

  selectedIds = computed(() => this.selectedIdsSignal());
  hoveredCourseId = computed(() => this.hoveredCourseIdSignal());

  private readonly rawCourseByIdMap = computed(() => {
    const map = new Map<string, Course>();
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
    this.courseStatusesSignal.set(this.initializeCourseStatuses());
    this.lessonStatusesSignal.set(this.initializeLessonStatuses());

    this.loadState();

    effect(() => {
      this.coursesByPlanSignal();
      this.courseStatusesSignal();
      this.lessonStatusesSignal();
      this.saveState();
    });
  }

  private currentRawCourses(): Course[] {
    const courses = this.coursesByPlanSignal().get(this.currentPlanIdSignal()) ?? [];
    const courseStatuses = this.courseStatusesSignal();
    return courses.map((c) => ({
      ...c,
      status: (courseStatuses.get(c.id) ?? 'pending') as CourseStatus,
    }));
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
      cursarReq: course.cursarReq.slice(),
      aprobarReq: course.aprobarReq.slice(),
      lessons: course.lessons.map((lesson) => ({ ...lesson })),
    }));
  }

  private initializeCourseStatuses(): Map<string, CourseStatus> {
    const statuses = new Map<string, CourseStatus>();
    COURSES_DATA.forEach((course) => {
      statuses.set(course.id, 'pending');
    });
    return statuses;
  }

  private initializeLessonStatuses(): Map<string, CourseStatus> {
    const statuses = new Map<string, CourseStatus>();
    COURSES_DATA.forEach((course) => {
      course.lessons.forEach((lesson) => {
        statuses.set(lesson.id, 'pending');
      });
    });
    return statuses;
  }

  private buildUnlockMap(): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    const courses = this.currentRawCourses();

    courses.forEach((course) => {
      map.set(course.id, new Set());
    });

    courses.forEach((target) => {
      const allReqs = [...new Set([...target.cursarReq, ...target.aprobarReq])];
      allReqs.forEach((reqId) => {
        map.get(reqId)?.add(target.id);
      });
    });

    return map;
  }

  getCourseById(id: string): Course | undefined {
    const raw = this.rawCourseByIdMap().get(id);
    if (!raw) return undefined;
    const status = (this.courseStatusesSignal().get(id) ?? 'pending') as CourseStatus;
    return { ...raw, status };
  }

  getRequiredCourseIds(course: Course): string[] {
    return [...new Set([...course.cursarReq, ...course.aprobarReq])];
  }

  getUnlockedCourseIds(courseId: string): string[] {
    const unlockMap = this.buildUnlockMap();
    return Array.from(unlockMap.get(courseId) || []);
  }

  private areRequirementsSatisfied(
    requiredIds: string[],
    requiredStatus: 'coursed' | 'approved',
  ): boolean {
    const courses = this.currentRawCourses();
    return requiredIds.every((reqId) => {
      const reqCourse = courses.find((c) => c.id === reqId);
      if (!reqCourse) return false;

      if (requiredStatus === 'coursed') {
        return reqCourse.status === 'coursed' || reqCourse.status === 'approved';
      }
      return reqCourse.status === 'approved';
    });
  }

  canChangeStatusTo(courseId: string, targetStatus: CourseStatus): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    if (targetStatus === 'pending') {
      return true; // Always can go back to pending
    }

    if (targetStatus === 'coursing' || targetStatus === 'coursed') {
      // 1. Direct cursarReq must be at least 'coursed' or 'approved'
      const cursarReqMet = this.areRequirementsSatisfied(course.cursarReq, 'coursed');
      if (!cursarReqMet) return false;

      // 2. Nested aprobarReq of prerequisites must be 'approved'
      // (e.g. to course Math 3, Math 2 must be 'coursed' AND Math 1 [Math 2's aprobarReq] must be 'approved')
      const courses = this.currentRawCourses();
      return course.cursarReq.every((reqId) => {
        const reqCourse = courses.find((c) => c.id === reqId);
        if (!reqCourse) return true;
        return this.areRequirementsSatisfied(reqCourse.aprobarReq, 'approved');
      });
    }

    if (targetStatus === 'approved') {
      // All aprobarReq must be 'approved'
      return this.areRequirementsSatisfied(course.aprobarReq, 'approved');
    }

    return false;
  }

  areAllRequirementsMet(course: Course): boolean {
    return this.canChangeStatusTo(course.id, 'coursing');
  }

  toggleCourseStatus(courseId: string): void {
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
      const updatedCourseStatuses = new Map(this.courseStatusesSignal());
      updatedCourseStatuses.set(courseId, nextStatus);
      this.courseStatusesSignal.set(updatedCourseStatuses);

      const updatedLessonStatuses = new Map(this.lessonStatusesSignal());
      course.lessons.forEach((lesson) => {
        updatedLessonStatuses.set(lesson.id, nextStatus);
      });
      this.lessonStatusesSignal.set(updatedLessonStatuses);
    }
  }

  toggleLessonStatus(lessonId: string): void {
    const lessonStatuses = this.lessonStatusesSignal();
    const oldStatus = lessonStatuses.get(lessonId) ?? 'pending';
    let nextStatus: CourseStatus;

    if (oldStatus === 'pending') {
      nextStatus = 'coursing';
    } else if (oldStatus === 'coursing') {
      nextStatus = 'coursed';
    } else if (oldStatus === 'coursed') {
      nextStatus = 'approved';
    } else {
      nextStatus = 'pending';
    }

    const updatedLessonStatuses = new Map(lessonStatuses);
    updatedLessonStatuses.set(lessonId, nextStatus);
    this.lessonStatusesSignal.set(updatedLessonStatuses);

    this.syncCourseStatusFromLessons(lessonId);
  }

  private syncCourseStatusFromLessons(lessonId: string): void {
    const courses = this.currentRawCourses();
    const course = courses.find((c) => c.lessons.some((l) => l.id === lessonId));
    if (!course) return;

    const lessonStatuses = this.lessonStatusesSignal();
    const lessonStatusValues = course.lessons.map((l) => lessonStatuses.get(l.id) ?? 'pending');
    const allSameStatus = lessonStatusValues.every((s) => s === lessonStatusValues[0]);

    if (allSameStatus) {
      const updatedCourseStatuses = new Map(this.courseStatusesSignal());
      updatedCourseStatuses.set(course.id, lessonStatusValues[0]);
      this.courseStatusesSignal.set(updatedCourseStatuses);
    }
  }

  toggleCourseSelection(courseId: string): void {
    const selected = new Set(this.selectedIdsSignal());
    if (selected.has(courseId)) {
      selected.delete(courseId);
    } else {
      selected.add(courseId);
    }
    this.selectedIdsSignal.set(selected);
  }

  setHoveredCourseId(courseId: string | null): void {
    this.hoveredCourseIdSignal.set(courseId);
  }

  reset(): void {
    this.courseStatusesSignal.set(this.initializeCourseStatuses());
    this.lessonStatusesSignal.set(this.initializeLessonStatuses());
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
        (c.cursarReq.includes(currentCourse.name) || c.aprobarReq.includes(currentCourse.name)),
    );
    if (overlappingDependent) {
      return `No se puede mover "${currentCourse.name}" porque "${overlappingDependent.name}" la requiere y está en el mismo año`;
    }

    // Block if any prerequisite of this course is already at the target year
    const allReqNames = [...new Set([...currentCourse.cursarReq, ...currentCourse.aprobarReq])];
    const overlappingPrereq = courses.find(
      (c) => c.year === targetYear && allReqNames.includes(c.name),
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
    // Find the course containing this lesson
    const courses = this.currentRawCourses();
    const currentCourse = courses.find((c) => c.lessons.some((l) => l.id === lessonId));

    if (!currentCourse) {
      console.warn(`Lesson ${lessonId} not found`);
      return;
    }

    // Avoid no-op
    if (currentCourse.year === targetYear && currentCourse.q === targetQ) {
      return;
    }

    // Check if a target course for this slot already exists (from a previous move)
    const duplicateId = `${currentCourse.id}-Y${targetYear}Q${targetQ}`;
    const existingTarget = courses.find((c) => c.id === duplicateId);

    // Build the moved course with all lessons from the source
    const movedCourse: Course = existingTarget
      ? {
          ...existingTarget,
          lessons: currentCourse.lessons.map((lesson) => ({
            id: lesson.id,
            professor: lesson.professor,
            day: lesson.day,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
          })),
        }
      : {
          id: duplicateId,
          name: currentCourse.name,
          year: targetYear,
          q: targetQ,
          status: 'pending',
          cursarReq: [...currentCourse.cursarReq],
          aprobarReq: [...currentCourse.aprobarReq],
          lessons: currentCourse.lessons.map((lesson) => ({
            id: lesson.id,
            professor: lesson.professor,
            day: lesson.day,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
          })),
        };

    // Lesson statuses are shared globally — no transfer needed.
    // Replace source course with moved course; remove source entirely
    const updatedCourses = courses
      .filter((c) => c.id !== currentCourse.id && c.id !== duplicateId)
      .concat(movedCourse);
    this.setCurrentRawCourses(updatedCourses);
  }

  private saveState(): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      const state = {
        coursesByPlan: this.serializeCoursesByPlan(this.coursesByPlanSignal()),
        courseStatuses: Object.fromEntries(this.courseStatusesSignal()),
        lessonStatuses: Object.fromEntries(this.lessonStatusesSignal()),
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

      if (state.courseStatuses) {
        this.courseStatusesSignal.set(
          new Map<string, CourseStatus>(Object.entries(state.courseStatuses)),
        );
      }

      if (state.lessonStatuses) {
        this.lessonStatusesSignal.set(
          new Map<string, CourseStatus>(Object.entries(state.lessonStatuses)),
        );
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
