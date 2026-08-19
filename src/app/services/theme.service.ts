import { Injectable, effect, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private static readonly THEME_KEY = 'organizador-cursada-theme';
  readonly isDarkMode = signal<boolean>(this.loadInitialTheme());

  constructor() {
    effect(() => {
      const isDark = this.isDarkMode();
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.body.setAttribute('data-theme', 'dark');
          document.documentElement.style.setProperty('color-scheme', 'dark');
        } else {
          document.body.removeAttribute('data-theme');
          document.documentElement.style.setProperty('color-scheme', 'light');
        }
      }
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ThemeService.THEME_KEY, isDark ? 'dark' : 'light');
        }
      } catch {}
    });
  }

  private loadInitialTheme(): boolean {
    let savedTheme: string | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        savedTheme = localStorage.getItem(ThemeService.THEME_KEY);
      }
    } catch {}

    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;

    return Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)')?.matches
    );
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((current) => !current);
  }
}
