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

  private readonly nameToIdMap = this.buildNameToIdMap();

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

  private buildNameToIdMap(): Map<string, string> {
    const map = new Map<string, string>();
    COURSES_DATA.forEach((course) => {
      map.set(course.name, course.id);
    });
    return map;
  }

  private buildUnlockMap(): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    const courses = this.currentRawCourses();

    courses.forEach((course) => {
      map.set(course.id, new Set());
    });

    courses.forEach((target) => {
      const allReqs = [...new Set([...target.cursarReq, ...target.aprobarReq])];
      allReqs.forEach((reqName) => {
        const srcId = this.nameToIdMap.get(reqName);
        if (srcId) {
          map.get(srcId)?.add(target.id);
        }
      });
    });

    return map;
  }

  getCourseById(id: string): Course | undefined {
    return this.currentRawCourses().find((c) => c.id === id);
  }

  getRequiredCourseIds(course: Course): string[] {
    const allReqs = [...new Set([...course.cursarReq, ...course.aprobarReq])];
    return allReqs.map((name) => this.nameToIdMap.get(name)).filter((id): id is string => !!id);
  }

  getUnlockedCourseIds(courseId: string): string[] {
    const unlockMap = this.buildUnlockMap();
    return Array.from(unlockMap.get(courseId) || []);
  }

  private areRequirementsSatisfied(
    requiredNames: string[],
    requiredStatus: 'coursed' | 'approved',
  ): boolean {
    const courses = this.currentRawCourses();
    return requiredNames.every((reqName) => {
      const reqCourse = courses.find((c) => c.name === reqName);
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
      // All cursarReq must be at least 'coursed'
      return this.areRequirementsSatisfied(course.cursarReq, 'coursed');
    }

    if (targetStatus === 'approved') {
      // All aprobarReq must be 'approved'
      return this.areRequirementsSatisfied(course.aprobarReq, 'approved');
    }

    return false;
  }

  areAllRequirementsMet(course: Course): boolean {
    const allCursarReqMet = this.areRequirementsSatisfied(course.cursarReq, 'coursed');
    const allAprobarReqMet = this.areRequirementsSatisfied(course.aprobarReq, 'approved');
    return allCursarReqMet && allAprobarReqMet;
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
