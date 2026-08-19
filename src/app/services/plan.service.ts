import { Injectable, inject, signal, WritableSignal, Injector } from '@angular/core';
import { CourseService } from './course.service';
import { CareerService } from './career.service';
import {
  sanitizePlans,
  sanitizeSemesterSlots,
  sanitizeStartingYear,
  cleanupOrphanedStorageKeys,
} from '../utils/storage-sanitizer.utils';

export interface Plan {
  id: string;
  label: string;
}

export interface SemesterSlot {
  id: string;
  courseYear: number;
  courseQ: number;
  startDate?: string;
  endDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  private static readonly PLANS_KEY = 'plans';
  private static readonly DEFAULT_PLANS: Plan[] = [{ id: '1', label: 'Plan de estudio 1' }];

  private readonly careerService = (() => {
    try {
      return inject(CareerService, { optional: true });
    } catch {
      return null;
    }
  })();

  private readonly courseService = (() => {
    try {
      return inject(CourseService, { optional: true });
    } catch {
      return null;
    }
  })();

  private getCareerService(): CareerService | null {
    return this.careerService;
  }

  private getCourseService(): CourseService | null {
    return this.courseService;
  }

  private readonly isWorkshopOpenSignal = signal<boolean>(false);
  readonly isWorkshopOpen = this.isWorkshopOpenSignal.asReadonly();

  openWorkshop(): void {
    this.isWorkshopOpenSignal.set(true);
  }

  closeWorkshop(): void {
    this.isWorkshopOpenSignal.set(false);
  }

  loadDemoPlan(): void {
    const careerService = this.getCareerService();
    if (careerService) {
      careerService.selectCareer('lic-diseno-audiovisual');
    }
    if (this.plansSignal().length === 0) {
      this.addPlan({ id: '1', label: 'Licenciatura en Diseño Audiovisual' });
    }
  }

  private readonly plansSignal: WritableSignal<Plan[]>;
  private readonly selectedPlanIdSignal = signal<string>('1');
  private readonly semesterListsSignal: WritableSignal<Map<string, SemesterSlot[]>>;
  private readonly startingYearsSignal: WritableSignal<Map<string, number>>;

  readonly plans;
  readonly selectedPlanId = this.selectedPlanIdSignal.asReadonly();
  readonly semesterLists;
  readonly startingYears;

  constructor() {
    const loadedPlans = this.loadPlans();
    this.plansSignal = signal<Plan[]>(loadedPlans);
    this.plans = this.plansSignal.asReadonly();

    const loadedSemesters = this.loadAllSemesterLists(loadedPlans);
    this.semesterListsSignal = signal<Map<string, SemesterSlot[]>>(loadedSemesters);
    this.semesterLists = this.semesterListsSignal.asReadonly();

    const loadedYears = this.loadAllStartingYears(loadedPlans);
    this.startingYearsSignal = signal<Map<string, number>>(loadedYears);
    this.startingYears = this.startingYearsSignal.asReadonly();
  }

  private safeGetItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {}
    return null;
  }

  private safeSetItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {}
  }

  private safeRemoveItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
      }
    } catch {}
  }

  addPlan(plan: Plan): void {
    if (!plan || !plan.id) return;
    this.plansSignal.update((plans) => {
      if (plans.some((p) => p.id === plan.id)) return plans;
      const updated = [...plans, plan];
      this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
    this.setSelectedPlanId(plan.id);
  }

  resetToNewUser(): void {
    const currentPlans = this.plansSignal();
    for (const plan of currentPlans) {
      this.safeRemoveItem(this.semesterListKey(plan.id));
      this.safeRemoveItem(this.startingYearKey(plan.id));
      this.getCourseService()?.deletePlan(plan.id);
    }
    this.safeRemoveItem(PlanService.PLANS_KEY);
    this.safeRemoveItem('selected-career-id');
    this.safeRemoveItem('removed-career-ids');
    this.safeRemoveItem('custom-careers-index');
    this.safeRemoveItem('course-organizer-state');
    this.safeRemoveItem('course-organizer-state-lic-diseno-audiovisual');
    cleanupOrphanedStorageKeys([], []);
    this.plansSignal.set([]);
    this.semesterListsSignal.set(new Map());
    this.startingYearsSignal.set(new Map());
  }

  deletePlan(planId: string): void {
    this.plansSignal.update((plans) => {
      const updated = plans.filter((p) => p.id !== planId);
      this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      if (updated.length > 0 && this.selectedPlanIdSignal() === planId) {
        this.selectedPlanIdSignal.set(updated[0].id);
      } else if (updated.length === 0) {
        this.selectedPlanIdSignal.set('');
      }
      cleanupOrphanedStorageKeys(
        updated.map((p) => p.id),
        this.careerService?.careers().map((c) => c.id) ?? [],
      );
      return updated;
    });
    this.semesterListsSignal.update((map) => {
      const next = new Map(map);
      next.delete(planId);
      return next;
    });
    this.startingYearsSignal.update((map) => {
      const next = new Map(map);
      next.delete(planId);
      return next;
    });
    this.safeRemoveItem(this.semesterListKey(planId));
    this.safeRemoveItem(this.startingYearKey(planId));
    this.getCourseService()?.deletePlan(planId);
  }

  private loadPlans(): Plan[] {
    const raw = this.safeGetItem(PlanService.PLANS_KEY);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        const sanitized = sanitizePlans(parsed, []);
        if (JSON.stringify(sanitized) !== raw) {
          this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(sanitized));
        }
        return sanitized;
      } catch {
        return [];
      }
    }
    return [];
  }

  private loadAllSemesterLists(plans: Plan[]): Map<string, SemesterSlot[]> {
    const map = new Map<string, SemesterSlot[]>();
    for (const plan of plans) {
      const raw = this.safeGetItem(this.semesterListKey(plan.id));
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeSemesterSlots(parsed);
          map.set(plan.id, sanitized);
        } catch {}
      }
    }
    return map;
  }

  private loadAllStartingYears(plans: Plan[]): Map<string, number> {
    const map = new Map<string, number>();
    const defaultYear = new Date().getFullYear();
    for (const plan of plans) {
      const raw = this.safeGetItem(this.startingYearKey(plan.id));
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeStartingYear(parsed, defaultYear);
          map.set(plan.id, sanitized);
        } catch {}
      }
    }
    return map;
  }

  getPlanLabel(id: string): string | undefined {
    return this.plansSignal().find((p) => p.id === id)?.label;
  }

  updatePlanLabel(id: string, newLabel: string): void {
    this.plansSignal.update((plans) => {
      const updated = plans.map((p) => (p.id === id ? { ...p, label: newLabel } : p));
      this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  setSelectedPlanId(id: string): void {
    this.selectedPlanIdSignal.set(id);
    this.getCourseService()?.setCurrentPlanId(id);
  }

  private semesterListKey(planId: string): string {
    return `plan-semesters-${planId}`;
  }

  getSemesterList(planId: string): SemesterSlot[] {
    return this.semesterListsSignal().get(planId) ?? [];
  }

  setSemesterList(planId: string, slots: SemesterSlot[]): void {
    this.semesterListsSignal.update((map) => {
      const next = new Map(map);
      next.set(planId, slots);
      return next;
    });
    this.safeSetItem(this.semesterListKey(planId), JSON.stringify(slots));
  }

  private startingYearKey(planId: string): string {
    return `plan-starting-year-${planId}`;
  }

  getStartingYear(planId: string): number {
    return this.startingYearsSignal().get(planId) ?? new Date().getFullYear();
  }

  setStartingYear(planId: string, year: number): void {
    this.startingYearsSignal.update((map) => {
      const next = new Map(map);
      next.set(planId, year);
      return next;
    });
    this.safeSetItem(this.startingYearKey(planId), JSON.stringify(year));
  }

  private getClosestWeekday(
    year: number,
    month: number,
    day: number,
    targetDayOfWeek: number,
  ): string {
    // targetDayOfWeek: 0 = Monday, 4 = Friday
    const date = new Date(year, month - 1, day);
    const currentDayOfWeek = date.getDay();
    // Convert JS day (0 = Sunday) to our convention (0 = Monday)
    const jsToOurWeekday = [6, 0, 1, 2, 3, 4, 5]; // Sun->6, Mon->0, Tue->1, etc.
    const currentDay = jsToOurWeekday[currentDayOfWeek];

    let daysToAdd = targetDayOfWeek - currentDay;
    // Find closest: prefer same week if possible, otherwise next week
    if (daysToAdd > 3) {
      daysToAdd -= 7;
    } else if (daysToAdd < -3) {
      daysToAdd += 7;
    }

    const result = new Date(date);
    result.setDate(result.getDate() + daysToAdd);

    const d = String(result.getDate()).padStart(2, '0');
    const m = String(result.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  }

  getDefaultSemesterDates(year: number, quarter: number): { startDate: string; endDate: string } {
    if (quarter === 1) {
      // Q1: Monday closest to April 1, Friday closest to June 15
      const startDate = this.getClosestWeekday(year, 4, 1, 0);
      const endDate = this.getClosestWeekday(year, 6, 15, 4);
      return { startDate, endDate };
    } else {
      // Q2: Monday closest to July 15, Friday closest to November 30
      const startDate = this.getClosestWeekday(year, 7, 15, 0);
      const endDate = this.getClosestWeekday(year, 11, 30, 4);
      return { startDate, endDate };
    }
  }
}

