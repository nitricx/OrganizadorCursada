import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

export interface SidebarItem {
  label: string;
  route?: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatExpansionModule],
})
export class SidebarComponent {
  items = input<SidebarItem[]>([
    { label: 'Home', route: '/home' },
    { label: 'Mi Semana', route: '/calendar' },
    {
      label: 'Calendario Académico',
      children: [
        { label: 'Plan de estudio', route: '/academicCalendar/plan' },
        { label: 'Plan de estudio 1', route: '/academicCalendar/plan-1' },
        { label: 'Plan de estudio 2', route: '/academicCalendar/plan-2' },
      ],
    },
  ]);
}
