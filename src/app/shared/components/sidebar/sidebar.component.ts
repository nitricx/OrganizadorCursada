import { Component, ChangeDetectionStrategy, computed, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

export interface SidebarItem {
  label: string;
  route?: string;
  action?: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule],
})
export class SidebarComponent {
  onOpenWorkshop = output<void>();
  onOpenPublisher = output<void>();

  items = computed<SidebarItem[]>(() => [
    { label: 'Home', route: '/home', icon: 'home' },
    { label: 'Mi Semana', route: '/myWeek', icon: 'calendar_view_week' },
    { label: 'Calendario Académico', route: '/academicCalendar', icon: 'date_range' },
    { label: 'Workshop', route: '/workshop', icon: 'store' },
    { label: 'Publicar Plan', route: '/publish', icon: 'publish' },
  ]);

  handleAction(item: SidebarItem): void {
    if (item.action === 'open_workshop') {
      this.onOpenWorkshop.emit();
    } else if (item.action === 'open_publisher') {
      this.onOpenPublisher.emit();
    }
  }
}

