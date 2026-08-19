import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SyncSchedulerService {
  private readonly LAST_SYNC_KEY = 'orgcursada_last_sync_timestamp';
  private readonly BASE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours baseline

  /**
   * Layer 4: Randomized Timing Jitter & Telemetry Normalization.
   * Calculates next check execution time using exponential uniform Gaussian jitter window (+-12h).
   * Prevents network timing correlation between class attendance and update check requests.
   */
  public calculateNextJitteredSyncTime(baseTimestampMs: number = Date.now()): number {
    // Uniform jitter between -12 hours and +12 hours in milliseconds
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const randomJitter = (Math.random() * 2 - 1) * twelveHoursMs;

    return baseTimestampMs + this.BASE_INTERVAL_MS + randomJitter;
  }

  public shouldExecuteSyncNow(): boolean {
    const lastSyncStr = this.getItem(this.LAST_SYNC_KEY);
    if (!lastSyncStr) return true;

    const lastSyncMs = parseInt(lastSyncStr, 10);
    const nextSyncMs = this.calculateNextJitteredSyncTime(lastSyncMs);

    return Date.now() >= nextSyncMs;
  }

  public recordSyncExecution(timestampMs: number = Date.now()): void {
    this.setItem(this.LAST_SYNC_KEY, timestampMs.toString());
  }

  private inMemoryStorage: Record<string, string> = {};

  private getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {}
    return this.inMemoryStorage[key] || null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return;
      }
    } catch {}
    this.inMemoryStorage[key] = value;
  }
}
