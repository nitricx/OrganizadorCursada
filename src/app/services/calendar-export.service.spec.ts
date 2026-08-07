import { TestBed } from '@angular/core/testing';
import { CalendarExportService } from './calendar-export.service';
import { CourseService } from './course.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';
import { DayOfWeek } from '../models/course';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('CalendarExportService', () => {
  let service: CalendarExportService;
  let courseServiceMock: any;
  let planServiceMock: any;
  let toastServiceMock: any;

  beforeEach(() => {
    courseServiceMock = {
      courses: signal([
        {
          id: 1,
          name: 'Programación I',
          year: 1,
          q: 1,
          status: 'coursing',
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [
            {
              id: 'P1-L1',
              professor: 'Gómez',
              day: DayOfWeek.Monday,
              startTime: '09:00',
              endTime: '13:00',
              status: 'coursing',
            },
          ],
        },
      ]),
      areAllRequirementsMet: vi.fn().mockReturnValue(true),
    };

    planServiceMock = {
      selectedPlanId: signal('1'),
      getPlanLabel: vi.fn().mockReturnValue('Plan de Sistemas'),
      getSemesterList: vi.fn().mockReturnValue([
        { id: 'Y1Q1', courseYear: 1, courseQ: 1, startDate: '01/04/2026', endDate: '15/06/2026' },
      ]),
      getStartingYear: vi.fn().mockReturnValue(2026),
      getDefaultSemesterDates: vi.fn().mockReturnValue({ startDate: '01/04/2026', endDate: '15/06/2026' }),
    };

    toastServiceMock = {
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CalendarExportService,
        { provide: CourseService, useValue: courseServiceMock },
        { provide: PlanService, useValue: planServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    });

    service = TestBed.inject(CalendarExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should compute active coursing events', () => {
    const events = service.activeCoursingEvents();
    expect(events.length).toBe(1);
    expect(events[0].course.name).toBe('Programación I');
    expect(events[0].lesson.id).toBe('P1-L1');
  });

  it('should retrieve plan info and semester dates', () => {
    const info = service.getPlanInfo();
    expect(info.label).toBe('Plan de Sistemas');

    const dates = service.getSemesterDates();
    expect(dates.startDate).toBe('01/04/2026');
    expect(dates.endDate).toBe('15/06/2026');
  });

  it('should generate Google Calendar web links for active events', () => {
    const links = service.getGoogleCalendarLinks();
    expect(links.length).toBe(1);
    expect(links[0].courseName).toBe('Programación I');
    expect(links[0].url).toContain('https://calendar.google.com/calendar/render');
  });

  it('should warn when exporting with no active events', () => {
    courseServiceMock.courses.set([]);
    service.exportToICS({ selectedEvents: [] });
    expect(toastServiceMock.warning).toHaveBeenCalledWith(
      'No hay materias activas en cursada para exportar.',
    );
  });
});
