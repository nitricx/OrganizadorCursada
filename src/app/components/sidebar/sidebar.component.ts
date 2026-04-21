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
    const count = this.planIdCounter;
    const newChild: SidebarItem = {
      label: `Plan de estudio ${count}`,
      route: `/academicCalendar/plan/${count}`,
      deletable: true,
      id: count.toString(),
    };
    this.items.update((items) =>
      items.map((i) => (i === item ? { ...i, children: [...(i.children ?? []), newChild] } : i)),
    );
    this.planService.addPlan({ id: count.toString(), label: `Plan de estudio ${count}` });
  }

  deletePlan(child: SidebarItem, parent: SidebarItem): void {
    if (!child.id) return;

    const deletedRoute = child.route;
    this.courseService.deletePlan(child.id);
    this.planService.deletePlan(child.id);
    this.items.update((items) =>
      items.map((i) =>
        i === parent ? { ...i, children: (i.children ?? []).filter((c) => c !== child) } : i,
      ),
    );

    if (deletedRoute && this.router.url === deletedRoute) {
      const remaining = this.planService.plans();
      const fallback = remaining.length > 0 ? `/academicCalendar/plan/${remaining[0].id}` : '/home';
      void this.router.navigateByUrl(fallback);
    }
  }
}
