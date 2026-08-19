import { TestBed } from '@angular/core/testing';
import { SyncSchedulerService } from './sync-scheduler.service';

describe('SyncSchedulerService', () => {
  let service: SyncSchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SyncSchedulerService);
  });

  it('should calculate next sync time with jitter within +-12 hours of 24h baseline', () => {
    const now = 1000000;
    const nextSync = service.calculateNextJitteredSyncTime(now);

    const minExpected = now + (12 * 60 * 60 * 1000); // 12 hours
    const maxExpected = now + (36 * 60 * 60 * 1000); // 36 hours

    expect(nextSync).toBeGreaterThanOrEqual(minExpected);
    expect(nextSync).toBeLessThanOrEqual(maxExpected);
  });

  it('should evaluate shouldExecuteSyncNow correctly when no sync has been recorded', () => {
    expect(service.shouldExecuteSyncNow()).toBe(true);
  });

  it('should record sync execution timestamp', () => {
    const now = Date.now();
    service.recordSyncExecution(now);
    expect(service.shouldExecuteSyncNow()).toBe(false);
  });
});
