import { Injectable, effect, signal, computed } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private static readonly THEME_KEY = 'organizador-cursada-theme';

  readonly mode = signal<ThemeMode>(this.loadInitialMode());
  private readonly systemIsDark = signal<boolean>(this.getInitialSystemPreference());

  readonly isDarkMode = computed<boolean>(() => {
    const currentMode = this.mode();
    if (currentMode === 'system') {
      return this.systemIsDark();
    }
    return currentMode === 'dark';
  });

  constructor() {
    this.initSystemThemeListener();

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
    });

    effect(() => {
      const currentMode = this.mode();
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(ThemeService.THEME_KEY, currentMode);
        }
      } catch {}
    });
  }

  private loadInitialMode(): ThemeMode {
    let savedTheme: string | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        savedTheme = localStorage.getItem(ThemeService.THEME_KEY);
      }
    } catch {}

    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
      return savedTheme;
    }

    return 'system';
  }

  private getInitialSystemPreference(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)')?.matches
    );
  }

  private initSystemThemeListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        this.systemIsDark.set(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateSystemTheme);
      } else if ('addListener' in mediaQuery) {
        (mediaQuery as any).addListener(updateSystemTheme);
      }
    }
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggleDarkMode(): void {
    const modes: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(this.mode());
    const nextMode = modes[(currentIndex + 1) % modes.length];
    this.setMode(nextMode);
  }
}

