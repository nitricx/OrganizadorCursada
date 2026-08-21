import { TestBed } from '@angular/core/testing';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize isDarkMode signal as a boolean', () => {
    const val = service.isDarkMode();
    expect(typeof val).toBe('boolean');
  });

  it('should allow setting mode explicitly to light, dark, system', () => {
    service.setMode('light');
    expect(service.mode()).toBe('light');
    expect(service.isDarkMode()).toBe(false);

    service.setMode('dark');
    expect(service.mode()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);

    service.setMode('system');
    expect(service.mode()).toBe('system');
  });

  it('should cycle through modes when toggleDarkMode is called', () => {
    service.setMode('system');
    service.toggleDarkMode();
    expect(service.mode()).toBe('light');

    service.toggleDarkMode();
    expect(service.mode()).toBe('dark');

    service.toggleDarkMode();
    expect(service.mode()).toBe('system');
  });
});

