import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { CareerSelectorComponent } from './components/career-selector/career-selector.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserMenuComponent } from './components/user-menu/user-menu';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [
    RouterModule,
    SidebarComponent,
    ToastContainerComponent,
    CareerSelectorComponent,
    UserMenuComponent,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  isOpen = signal(true);
  isDarkMode = signal(false);

  toggleDarkMode(): void {
    const nextTheme = !this.isDarkMode();
    this.isDarkMode.set(nextTheme);
    if (nextTheme) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  }
}

