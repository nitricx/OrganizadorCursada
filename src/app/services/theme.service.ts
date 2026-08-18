import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly isDarkMode = signal<boolean>(false);

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
      // Ignore storage errors
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
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
        document.documentElement.style.setProperty('color-scheme', 'dark');
      } else {
        document.body.removeAttribute('data-theme');
        document.documentElement.style.setProperty('color-scheme', 'light');
      }
    }
  }
}
