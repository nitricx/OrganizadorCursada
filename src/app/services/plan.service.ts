import { Injectable, signal } from '@angular/core';

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

  private readonly plansSignal = signal<Plan[]>(this.loadPlans());
  private readonly selectedPlanIdSignal = signal<string>('1');
  private readonly semesterListsSignal = signal<Map<string, SemesterSlot[]>>(
    this.loadAllSemesterLists(),
  );
  private readonly startingYearsSignal = signal<Map<string, number>>(
    this.loadAllStartingYears(),
  );

  plans = this.plansSignal.asReadonly();
  selectedPlanId = this.selectedPlanIdSignal.asReadonly();
  semesterLists = this.semesterListsSignal.asReadonly();
  startingYears = this.startingYearsSignal.asReadonly();

  constructor() {}

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
    this.plansSignal.update((plans) => {
      const updated = [...plans, plan];
      this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  deletePlan(planId: string): void {
    this.plansSignal.update((plans) => {
      const updated = plans.filter((p) => p.id !== planId);
      this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(updated));
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
  }

  private loadPlans(): Plan[] {
    const raw = this.safeGetItem(PlanService.PLANS_KEY);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as Plan[];
        const deduplicated = parsed.filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
        );
        if (deduplicated.length !== parsed.length) {
          this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(deduplicated));
        }
        return deduplicated;
      } catch {
        return PlanService.DEFAULT_PLANS;
      }
    }
    const plans = PlanService.DEFAULT_PLANS;
    this.safeSetItem(PlanService.PLANS_KEY, JSON.stringify(plans));
    return plans;
  }

  private loadAllSemesterLists(): Map<string, SemesterSlot[]> {
    const map = new Map<string, SemesterSlot[]>();
    const plans = this.plansSignal ? this.plansSignal() : this.loadPlans();
    for (const plan of plans) {
      const raw = this.safeGetItem(this.semesterListKey(plan.id));
      if (raw !== null) {
        try {
          const slots = JSON.parse(raw) as SemesterSlot[];
          map.set(plan.id, slots);
        } catch {}
      }
    }
    return map;
  }

  private loadAllStartingYears(): Map<string, number> {
    const map = new Map<string, number>();
    const plans = this.plansSignal ? this.plansSignal() : this.loadPlans();
    for (const plan of plans) {
      const raw = this.safeGetItem(this.startingYearKey(plan.id));
      if (raw !== null) {
        try {
          const year = JSON.parse(raw) as number;
          map.set(plan.id, year);
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

