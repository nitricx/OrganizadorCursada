import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface Plan {
  id: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  private static readonly PLANS_KEY = 'plans';
  private static readonly DEFAULT_PLANS: Plan[] = [{ id: '1', label: 'Plan de estudio 1' }];

  private readonly plansSignal = signal<Plan[]>(this.loadPlans());
  private readonly selectedPlanIdSignal = signal<string>('1');

  plans = this.plansSignal.asReadonly();
  selectedPlanId = this.selectedPlanIdSignal.asReadonly();

  constructor() {}

  addPlan(plan: Plan): void {
    this.plansSignal.update((plans) => {
      const updated = [...plans, plan];
      localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  deletePlan(planId: string): void {
    this.plansSignal.update((plans) => {
      const updated = plans.filter((p) => p.id !== planId);
      localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
    localStorage.removeItem(this.semesterListKey(planId));
  }

  private loadPlans(): Plan[] {
    const raw = localStorage.getItem(PlanService.PLANS_KEY);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw) as Plan[];
        const deduplicated = parsed.filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
        );
        if (deduplicated.length !== parsed.length) {
          localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(deduplicated));
        }
        return deduplicated;
      } catch {
        return PlanService.DEFAULT_PLANS;
      }
    }
    const plans = PlanService.DEFAULT_PLANS;
    localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(plans));
    return plans;
  }

  getPlanLabel(id: string): string | undefined {
    return this.plansSignal().find((p) => p.id === id)?.label;
  }

  updatePlanLabel(id: string, newLabel: string): void {
    this.plansSignal.update((plans) => {
      const updated = plans.map((p) => (p.id === id ? { ...p, label: newLabel } : p));
      localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  setSelectedPlanId(id: string): void {
    this.selectedPlanIdSignal.set(id);
  }

  private semesterListKey(planId: string): string {
    return `plan-semesters-${planId}`;
  }

  getSemesterList(
    planId: string,
  ): { id: string; courseYear: number; courseQ: number; startDate?: string; endDate?: string }[] {
    const raw = localStorage.getItem(this.semesterListKey(planId));
    try {
      return raw !== null
        ? (JSON.parse(raw) as {
            id: string;
            courseYear: number;
            courseQ: number;
            startDate?: string;
            endDate?: string;
          }[])
        : [];
    } catch {
      return [];
    }
  }

  setSemesterList(
    planId: string,
    slots: {
      id: string;
      courseYear: number;
      courseQ: number;
      startDate?: string;
      endDate?: string;
    }[],
  ): void {
    localStorage.setItem(this.semesterListKey(planId), JSON.stringify(slots));
  }

  private startingYearKey(planId: string): string {
    return `plan-starting-year-${planId}`;
  }

  getStartingYear(planId: string): number {
    const raw = localStorage.getItem(this.startingYearKey(planId));
    try {
      return raw !== null ? (JSON.parse(raw) as number) : new Date().getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  }

  setStartingYear(planId: string, year: number): void {
    localStorage.setItem(this.startingYearKey(planId), JSON.stringify(year));
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
