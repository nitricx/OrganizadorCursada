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
  private readonly plansSignal = signal<Plan[]>([{ id: '1', label: 'Plan de estudio 1' }]);

  plans = this.plansSignal.asReadonly();

  addPlan(plan: Plan): void {
    this.plansSignal.update((plans) => [...plans, plan]);
  }

  getPlanLabel(id: string): string | undefined {
    return this.plansSignal().find((p) => p.id === id)?.label;
  }
}
