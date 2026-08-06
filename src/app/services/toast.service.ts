import { Injectable, signal } from '@angular/core';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  show(message: string, type: ToastType = 'info', durationMs: number = 3500): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const toast: Toast = { id, message, type, durationMs };

    this.toasts.update((current) => [...current, toast]);

    if (durationMs > 0) {
      const timeoutId = setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
      this.timeouts.set(id, timeoutId);
    }

    return id;
  }

  warning(message: string, durationMs: number = 3500): string {
    return this.show(message, 'warning', durationMs);
  }

  error(message: string, durationMs: number = 3500): string {
    return this.show(message, 'error', durationMs);
  }

  success(message: string, durationMs: number = 3500): string {
    return this.show(message, 'success', durationMs);
  }

  info(message: string, durationMs: number = 3500): string {
    return this.show(message, 'info', durationMs);
  }

  dismiss(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeouts.clear();
    this.toasts.set([]);
  }
}
