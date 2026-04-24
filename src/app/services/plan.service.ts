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

  setSelectedPlanId(id: string): void {
    this.selectedPlanIdSignal.set(id);
  }

  private semesterListKey(planId: string): string {
    return `plan-semesters-${planId}`;
  }

  getSemesterList(planId: string): { id: string; courseYear: number; courseQ: number }[] {
    const raw = localStorage.getItem(this.semesterListKey(planId));
    try {
      return raw !== null
        ? (JSON.parse(raw) as { id: string; courseYear: number; courseQ: number }[])
        : [];
    } catch {
      return [];
    }
  }

  setSemesterList(
    planId: string,
    slots: { id: string; courseYear: number; courseQ: number }[],
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
}
