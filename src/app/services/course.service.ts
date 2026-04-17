import { Injectable, inject } from '@angular/core';
import { signal, computed } from '@angular/core';
import { Course } from '../models/course';
import { COURSES_DATA } from '../data/courses.data';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private readonly STORAGE_KEY = 'materiasStatus_tea';
  private coursesSignal = signal<Course[]>(this.initializeCourses());
  private selectedIdsSignal = signal<Set<string>>(new Set());
  private hoveredCourseIdSignal = signal<string | null>(null);

  courses = computed(() => this.coursesSignal());
  selectedIds = computed(() => this.selectedIdsSignal());
  hoveredCourseId = computed(() => this.hoveredCourseIdSignal());

  private readonly nameToIdMap = this.buildNameToIdMap();

  constructor() {
    this.loadState();
  }

  private initializeCourses(): Course[] {
    return COURSES_DATA.map((course) => ({
      ...course,
      cursarReq: course.cursarReq.slice(),
      aprobarReq: course.aprobarReq.slice(),
    }));
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

  toggleCourseStatus(courseId: string): void {
    const courses = this.coursesSignal();
    const courseIndex = courses.findIndex((c) => c.id === courseId);

    if (courseIndex !== -1) {
      const updatedCourses = [...courses];
      const course = updatedCourses[courseIndex];

      if (course.status === 'pending') {
        course.status = 'encurso';
      } else if (course.status === 'encurso') {
        course.status = 'approved';
      } else {
        course.status = 'pending';
      }

      this.coursesSignal.set(updatedCourses);
      this.saveState();
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
    const courses = this.coursesSignal();
    const resetCourses = courses.map((course) => ({
      ...course,
      status: 'pending' as const,
    }));
    this.coursesSignal.set(resetCourses);
    this.selectedIdsSignal.set(new Set());
    this.saveState();
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return;

      const obj = JSON.parse(saved) as Record<string, string>;
      const courses = this.coursesSignal();
      const updatedCourses = courses.map((course) => ({
        ...course,
        status: (obj[course.id] || course.status) as any,
      }));
      this.coursesSignal.set(updatedCourses);
    } catch (e) {
      console.error('Error loading course state:', e);
    }
  }

  private saveState(): void {
    const obj: Record<string, string> = {};
    this.coursesSignal().forEach((course) => {
      obj[course.id] = course.status;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
  }
}
