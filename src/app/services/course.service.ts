import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Course, CourseStatus } from '../models/course';
import { COURSES_DATA } from '../data/courses.data';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private coursesSignal = signal<Course[]>(this.initializeCourses());
  private lessonStatesByPlanSignal = signal<Map<string, Map<string, CourseStatus>>>(new Map());
  private currentPlanIdSignal = signal<string>('1');
  private selectedIdsSignal = signal<Set<string>>(new Set());
  private hoveredCourseIdSignal = signal<string | null>(null);

  courses = computed(() => {
    const courses = this.coursesSignal();
    const lessonStatesByPlan = this.lessonStatesByPlanSignal();
    const currentPlanId = this.currentPlanIdSignal();
    const lessonStates = lessonStatesByPlan.get(currentPlanId) || new Map();

    // Merge lesson states into courses for display
    return courses.map((course) => {
      const updatedLessons = course.lessons.map((lesson) => ({
        ...lesson,
        status: (lessonStates.get(lesson.id) || 'pending') as CourseStatus,
      }));

      return {
        ...course,
        lessons: updatedLessons,
      };
    });
  });
  selectedIds = computed(() => this.selectedIdsSignal());
  hoveredCourseId = computed(() => this.hoveredCourseIdSignal());

  private readonly nameToIdMap = this.buildNameToIdMap();

  constructor() {}

  private initializeCourses(): Course[] {
    return COURSES_DATA.map((course) => ({
      ...course,
      status: 'pending',
      cursarReq: course.cursarReq.slice(),
      aprobarReq: course.aprobarReq.slice(),
      lessons: course.lessons.map((lesson) => ({
        ...lesson,
      })),
    }));
  }

  private initializeLessonStatesForPlan(planId: string): Map<string, CourseStatus> {
    const states = new Map<string, CourseStatus>();
    COURSES_DATA.forEach((course) => {
      course.lessons.forEach((lesson) => {
        states.set(lesson.id, 'pending');
      });
    });
    return states;
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
    const courses = this.coursesSignal();

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
    return this.coursesSignal().find((c) => c.id === id);
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
    const courses = this.coursesSignal();
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
    const courses = this.coursesSignal();
    const courseIndex = courses.findIndex((c) => c.id === courseId);

    if (courseIndex !== -1) {
      const updatedCourses = [...courses];
      const course = updatedCourses[courseIndex];
      let nextStatus: CourseStatus;

      // Cycle through states in legend order: Unselected → Planned → Coursing → Finished
      // pending → coursed → coursing → approved → pending
      if (course.status === 'pending') {
        nextStatus = 'coursed'; // Unselected → Planned
      } else if (course.status === 'coursed') {
        nextStatus = 'coursing'; // Planned → Coursing
      } else if (course.status === 'coursing') {
        nextStatus = 'approved'; // Coursing → Finished
      } else {
        nextStatus = 'pending'; // Finished → Unselected
      }

      if (this.canChangeStatusTo(courseId, nextStatus)) {
        course.status = nextStatus;
        this.coursesSignal.set(updatedCourses);
      }
    }
  }

  toggleLessonStatus(lessonId: string): void {
    const lessonStatesByPlan = this.lessonStatesByPlanSignal();
    const currentPlanId = this.currentPlanIdSignal();
    const planStates = lessonStatesByPlan.get(currentPlanId);

    if (!planStates) {
      console.warn(`No lesson states found for plan ${currentPlanId}`);
      return;
    }

    const oldStatus = planStates.get(lessonId) || 'pending';
    let nextStatus: CourseStatus;

    // Cycle through states: pending → coursed → coursing → approved → pending
    if (oldStatus === 'pending') {
      nextStatus = 'coursed';
    } else if (oldStatus === 'coursed') {
      nextStatus = 'coursing';
    } else if (oldStatus === 'coursing') {
      nextStatus = 'approved';
    } else {
      nextStatus = 'pending';
    }

    // Create new map with updated state
    const updatedPlanStates = new Map(planStates);
    updatedPlanStates.set(lessonId, nextStatus);

    // Update the plan-specific states
    const updatedStatesByPlan = new Map(lessonStatesByPlan);
    updatedStatesByPlan.set(currentPlanId, updatedPlanStates);
    this.lessonStatesByPlanSignal.set(updatedStatesByPlan);
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
    const currentPlanId = this.currentPlanIdSignal();
    const lessonStatesByPlan = this.lessonStatesByPlanSignal();
    const states = this.initializeLessonStatesForPlan(currentPlanId);

    const updatedStatesByPlan = new Map(lessonStatesByPlan);
    updatedStatesByPlan.set(currentPlanId, states);
    this.lessonStatesByPlanSignal.set(updatedStatesByPlan);
    this.coursesSignal.set(this.initializeCourses());
    this.selectedIdsSignal.set(new Set());
  }

  setCurrentPlanId(planId: string): void {
    this.currentPlanIdSignal.set(planId);

    // Initialize lesson states for this plan if they don't exist
    const lessonStatesByPlan = this.lessonStatesByPlanSignal();
    if (!lessonStatesByPlan.has(planId)) {
      const updatedStatesByPlan = new Map(lessonStatesByPlan);
      updatedStatesByPlan.set(planId, this.initializeLessonStatesForPlan(planId));
      this.lessonStatesByPlanSignal.set(updatedStatesByPlan);
    }
  }
}
