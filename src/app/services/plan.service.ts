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

  constructor() {
    this.plansSignal().forEach((p) => this.initExtraYearsForPlan(p.id));
  }

  addPlan(plan: Plan): void {
    this.plansSignal.update((plans) => {
      const updated = [...plans, plan];
      localStorage.setItem(PlanService.PLANS_KEY, JSON.stringify(updated));
      return updated;
    });
    this.initExtraYearsForPlan(plan.id);
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

  private extraSlotsKey(planId: string): string {
    return `plan-extra-slots-${planId}`;
  }

  private initExtraYearsForPlan(planId: string): void {
    const key = this.extraSlotsKey(planId);
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  }

  getExtraSlots(planId: string): { id: string; afterId: string }[] {
    const raw = localStorage.getItem(this.extraSlotsKey(planId));
    try {
      return raw !== null ? (JSON.parse(raw) as { id: string; afterId: string }[]) : [];
    } catch {
      return [];
    }
  }

  setExtraSlots(planId: string, slots: { id: string; afterId: string }[]): void {
    localStorage.setItem(this.extraSlotsKey(planId), JSON.stringify(slots));
  }
}
