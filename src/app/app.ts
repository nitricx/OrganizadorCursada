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

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    let savedTheme: string | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        savedTheme = localStorage.getItem('organizador-cursada-theme');
      }
    } catch {
      // Ignore storage errors in test environments
    }

    let isDark = false;
    if (savedTheme === 'dark') {
      isDark = true;
    } else if (savedTheme === 'light') {
      isDark = false;
    } else {
      isDark =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.applyTheme(isDark);
  }

  toggleDarkMode(): void {
    const nextTheme = !this.isDarkMode();
    this.applyTheme(nextTheme);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('organizador-cursada-theme', nextTheme ? 'dark' : 'light');
      }
    } catch {
      // Ignore storage errors
    }
  }

  private applyTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    if (isDark) {
      document.body.setAttribute('data-theme', 'dark');
      document.documentElement.style.setProperty('color-scheme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
      document.documentElement.style.setProperty('color-scheme', 'light');
    }
  }
}

