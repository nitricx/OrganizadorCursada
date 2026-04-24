import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
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
  private planIdCounter = Math.max(...this.planService.plans().map((p) => Number(p.id)), 1);

  items = signal<SidebarItem[]>([
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
    this.planIdCounter++;
    const id = this.planIdCounter;
    const labelNumber = this.planService.plans().length + 1;
    const newChild: SidebarItem = {
      label: `Plan de estudio ${labelNumber}`,
      route: `/academicCalendar/plan/${id}`,
      deletable: true,
      id: id.toString(),
    };
    this.items.update((items) =>
      items.map((i) => (i === item ? { ...i, children: [...(i.children ?? []), newChild] } : i)),
    );
    this.planService.addPlan({ id: id.toString(), label: `Plan de estudio ${labelNumber}` });
  }
}
