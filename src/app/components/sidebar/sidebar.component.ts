import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface SidebarItem {
  label: string;
  route?: string;
  children?: SidebarItem[];
  addButton?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatExpansionModule, MatIconModule, MatButtonModule],
})
export class SidebarComponent {
  items = signal<SidebarItem[]>([
    { label: 'Home', route: '/home' },
    { label: 'Mi Semana', route: '/calendar' },
    {
      label: 'Calendario Académico',
      children: [{ label: 'Plan de estudio 1', route: '/academicCalendar/plan/1' }],
      addButton: true,
    },
  ]);

  addPlan(item: SidebarItem): void {
    const count = (item.children?.length ?? 0) + 1;
    const newChild: SidebarItem = {
      label: `Plan de estudio ${count}`,
      route: `/academicCalendar/plan/${count}`,
    };
    this.items.update((items) =>
      items.map((i) => (i === item ? { ...i, children: [...(i.children ?? []), newChild] } : i)),
    );
  }
}
