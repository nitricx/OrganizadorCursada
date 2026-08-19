import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

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
    expect(val === true || val === false).toBe(true);
  });

  it('should toggle dark mode state when toggleDarkMode is called', () => {
    const initial = service.isDarkMode();
    service.toggleDarkMode();
    expect(service.isDarkMode()).toBe(!initial);
  });
});
