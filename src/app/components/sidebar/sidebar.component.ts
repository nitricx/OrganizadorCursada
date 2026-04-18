import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

export interface SidebarItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatListModule, MatIconModule],
})
export class SidebarComponent {
  items = input<SidebarItem[]>([
    { label: 'Home', route: '/home' },
    { label: 'Mi Semana', route: '/calendar' },
    { label: 'Calendario Académico', route: '/academicCalendar' },
  ]);
}
