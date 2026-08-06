import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlanService } from '../../services/plan.service';
import { CourseService } from '../../services/course.service';

export interface SidebarItem {
  label: string;
  route?: string;
  children?: SidebarItem[];
  addButton?: boolean;
  deletable?: boolean;
  id?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatExpansionModule, MatIconModule, MatButtonModule],
})
export class SidebarComponent {
  private readonly planService = inject(PlanService);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);

  items = computed(() => [
    { label: 'Home', route: '/home' },
    { label: 'Mi Semana', route: '/myWeek' },
    { label: 'Correlatividades', route: '/requisites' },
    {
      label: 'Calendario Académico',
      children: this.planService.plans().map((p) => ({
        label: p.label,
        route: `/academicCalendar/plan/${p.id}`,
        deletable: p.id !== '1',
        id: p.id,
      })),
      addButton: true,
    },
  ]);

  addPlan(item: SidebarItem): void {
    const existingIds = this.planService
      .plans()
      .map((p) => Number(p.id))
      .filter((n) => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const labelNumber = this.planService.plans().length + 1;
    this.planService.addPlan({ id: nextId.toString(), label: `Plan de estudio ${labelNumber}` });
  }
}
