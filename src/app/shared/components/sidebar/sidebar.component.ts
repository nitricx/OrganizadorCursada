import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PlanService } from '../../../services/plan.service';
import { CourseService } from '../../../services/course.service';
import { CareerService } from '../../../services/career.service';
import { ToastService } from '../../../services/toast.service';

export interface SidebarItem {
  label: string;
  route?: string;
  children?: SidebarItem[];
  addButton?: boolean;
  deletable?: boolean;
  id?: string;
  action?: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterModule, MatListModule, MatExpansionModule, MatIconModule, MatButtonModule],
})
export class SidebarComponent {
  private readonly planService = inject(PlanService);
  private readonly courseService = inject(CourseService);
  private readonly careerService = inject(CareerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  onOpenWorkshop = output<void>();
  onOpenPublisher = output<void>();

  items = computed<SidebarItem[]>(() => [
    { label: 'Home', route: '/home', icon: 'home' },
    { label: 'Mi Semana', route: '/myWeek', icon: 'calendar_view_week' },
    {
      label: 'Calendario Académico',
      route: '/academicCalendar',
      icon: 'date_range',
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
    const selectedId = this.careerService.selectedCareerId();
    const activeCareer = this.careerService.activeCareer();

    if (!selectedId || !activeCareer || activeCareer.id === 'empty-plan') {
      this.toastService.warning(
        'Seleccioná un plan de estudio en el menú superior o en el Plan Hub para poder agregar un plan de cursada.',
      );
      this.planService.openWorkshop();
      return;
    }

    const existingIds = this.planService
      .plans()
      .map((p) => Number(p.id))
      .filter((n) => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const labelNumber = this.planService.plans().length + 1;
    this.planService.addPlan({ id: nextId.toString(), label: `Plan de estudio ${labelNumber}` });
  }

  handleAction(item: SidebarItem): void {
    if (item.action === 'open_workshop') {
      this.onOpenWorkshop.emit();
    } else if (item.action === 'open_publisher') {
      this.onOpenPublisher.emit();
    }
  }
}
