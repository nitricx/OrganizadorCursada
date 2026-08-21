import {
  parseDate,
  jsDayToDayOfWeek,
  getFirstOccurrenceDate,
  formatICalDateTime,
  generateICalendarContent,
  generateGoogleCalendarWebUrl,
  escapeICalText,
  sanitizeICalHeaderValue,
} from './calendar-export.utils';
import { DayOfWeek } from '../models/course';
import { ExportCalendarOptions } from '../models/calendar-sync.model';

describe('calendar-export.utils', () => {
  describe('parseDate', () => {
    it('should parse YYYY-MM-DD correctly', () => {
      const date = parseDate('2026-04-15');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3); // April is month index 3
      expect(date.getDate()).toBe(15);
    });

    it('should parse DD/MM/YYYY correctly', () => {
      const date = parseDate('01/04/2026');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(3);
      expect(date.getDate()).toBe(1);
    });

    it('should parse DD/MM with default year', () => {
      const date = parseDate('15/06', 2026);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(5); // June
      expect(date.getDate()).toBe(15);
    });
  });

  describe('jsDayToDayOfWeek', () => {
    it('should correctly map JS day index to DayOfWeek enum', () => {
      expect(jsDayToDayOfWeek(1)).toBe(DayOfWeek.Monday); // Mon
      expect(jsDayToDayOfWeek(2)).toBe(DayOfWeek.Tuesday); // Tue
      expect(jsDayToDayOfWeek(5)).toBe(DayOfWeek.Friday); // Fri
      expect(jsDayToDayOfWeek(6)).toBe(DayOfWeek.Saturday); // Sat
    });
  });

  describe('getFirstOccurrenceDate', () => {
    it('should return same date if startDate is already the target day', () => {
      // 2026-04-06 is a Monday (JS day 1)
      const startDate = new Date(2026, 3, 6);
      const firstMonday = getFirstOccurrenceDate(startDate, DayOfWeek.Monday);
      expect(firstMonday.getDate()).toBe(6);
    });

    it('should find next Wednesday when starting from Monday', () => {
      // 2026-04-06 is Monday
      const startDate = new Date(2026, 3, 6);
      const firstWed = getFirstOccurrenceDate(startDate, DayOfWeek.Wednesday);
      expect(firstWed.getDate()).toBe(8); // April 8th is Wednesday
    });
  });

  describe('formatICalDateTime', () => {
    it('should format date and time in YYYYMMDDTHHMMSS', () => {
      const date = new Date(2026, 3, 1); // 2026-04-01
      const formatted = formatICalDateTime(date, '08:30');
      expect(formatted).toBe('20260401T083000');
    });
  });

  describe('sanitizeICalHeaderValue', () => {
    it('should strip CRLF characters and replace with space', () => {
      const input = 'Plan\r\nHeader Injection\nTest';
      const output = sanitizeICalHeaderValue(input);
      expect(output).toBe('Plan Header Injection Test');
      expect(output).not.toContain('\r');
      expect(output).not.toContain('\n');
    });
  });

  describe('escapeICalText', () => {
    it('should escape commas, semicolons, and newlines', () => {
      const input = 'Materia, 1; Prof: Juan\nLinea 2';
      const output = escapeICalText(input);
      expect(output).toContain('Materia\\, 1\\; Prof: Juan\\nLinea 2');
    });

    it('should handle carriage returns and CRLF without leaving raw line breaks', () => {
      const input = 'Materia\r\nInyectada\rTest';
      const output = escapeICalText(input);
      expect(output).toBe('Materia\\nInyectada\\nTest');
      expect(output).not.toContain('\r');
    });
  });

  describe('generateICalendarContent', () => {
    it('should generate valid RFC 5545 VCALENDAR content', () => {
      const options: ExportCalendarOptions = {
        planId: '1',
        planLabel: 'Plan Informática',
        startDate: '01/04/2026',
        endDate: '15/06/2026',
        selectedEvents: [
          {
            course: {
              id: 101,
              name: 'Matemática I',
              year: 1,
              q: 1,
              status: 'coursing',
              cursarReqId: [],
              aprobarReqId: [],
              lessons: [
                {
                  id: 'M1-L1',
                  professor: 'García',
                  day: DayOfWeek.Monday,
                  startTime: '08:00',
                  endTime: '12:00',
                  status: 'coursing',
                },
              ],
            },
            lesson: {
              id: 'M1-L1',
              professor: 'García',
              day: DayOfWeek.Monday,
              startTime: '08:00',
              endTime: '12:00',
              status: 'coursing',
            },
          },
        ],
      };

      const content = generateICalendarContent(options);
      expect(content).toContain('BEGIN:VCALENDAR');
      expect(content).toContain('VERSION:2.0');
      expect(content).toContain('BEGIN:VEVENT');
      expect(content).toContain('SUMMARY:Matemática I - Prof. García');
      expect(content).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260615T235959');
      expect(content).toContain('END:VEVENT');
      expect(content).toContain('END:VCALENDAR');
    });

    it('should prevent CRLF injection in planLabel header', () => {
      const options: ExportCalendarOptions = {
        planId: '1',
        planLabel: 'Plan Informática\r\nBEGIN:VEVENT\r\nSUMMARY:Injected Event\r\nEND:VEVENT',
        startDate: '01/04/2026',
        endDate: '15/06/2026',
        selectedEvents: [],
      };

      const content = generateICalendarContent(options);
      expect(content).toContain(
        'X-WR-CALNAME:Plan Informática BEGIN:VEVENT SUMMARY:Injected Event END:VEVENT',
      );
      // Ensure VEVENT was not injected into the root VCALENDAR body
      expect(content).not.toContain('\r\nBEGIN:VEVENT\r\nSUMMARY:Injected Event');
    });
  });

  describe('generateGoogleCalendarWebUrl', () => {
    it('should build valid Google Calendar web template URL', () => {
      const item = {
        course: {
          id: 101,
          name: 'Física I',
          year: 1,
          q: 1,
          status: 'coursing' as const,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
        lesson: {
          id: 'F1-L1',
          professor: 'Pérez',
          day: DayOfWeek.Tuesday,
          startTime: '14:00',
          endTime: '18:00',
        },
      };

      const url = generateGoogleCalendarWebUrl(item, '01/04/2026', '15/06/2026', 'Plan Test');
      expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
      expect(url).toContain('text=F%C3%ADsica+I+%28P%C3%A9rez%29');
      expect(url).toContain('BYDAY%3DTU');
    });
  });
});
