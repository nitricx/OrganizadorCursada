import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast and auto-dismiss after duration', () => {
    const id = service.show('Test message', 'info', 3000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0]).toEqual({
      id,
      message: 'Test message',
      type: 'info',
      durationMs: 3000,
    });

    vi.advanceTimersByTime(1500);
    expect(service.toasts().length).toBe(1);

    vi.advanceTimersByTime(1500);
    expect(service.toasts().length).toBe(0);
  });

  it('should support helper methods for warning, error, success, and info, keeping only the latest notification', () => {
    service.warning('Warning msg');
    service.error('Error msg');
    service.success('Success msg');
    service.info('Info msg');

    const activeToasts = service.toasts();
    expect(activeToasts.length).toBe(1);
    expect(activeToasts[0].type).toBe('info');
    expect(activeToasts[0].message).toBe('Info msg');

    vi.advanceTimersByTime(3500);
    expect(service.toasts().length).toBe(0);
  });

  it('should manually dismiss a toast', () => {
    const id = service.warning('Manual dismiss test', 10000);
    expect(service.toasts().length).toBe(1);

    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('should clear active toast', () => {
    service.warning('Msg 1');
    expect(service.toasts().length).toBe(1);

    service.clear();
    expect(service.toasts().length).toBe(0);
  });

});
