import { DayOfWeek } from '../models/course';
import { CalendarEventItem, ExportCalendarOptions } from '../models/calendar-sync.model';

export const ICAL_DAY_MAP: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'MO',
  [DayOfWeek.Tuesday]: 'TU',
  [DayOfWeek.Wednesday]: 'WE',
  [DayOfWeek.Thursday]: 'TH',
  [DayOfWeek.Friday]: 'FR',
  [DayOfWeek.Saturday]: 'SA',
};

/**
 * Parses date string in format "DD/MM", "DD/MM/YYYY", or "YYYY-MM-DD".
 */
export function parseDate(dateStr: string, defaultYear: number = new Date().getFullYear()): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(defaultYear, 0, 1);
  }

  const trimmed = dateStr.trim();

  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Format: DD/MM/YYYY or DD/MM
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(Number);
    if (parts.length >= 2) {
      const day = parts[0];
      const month = parts[1] - 1;
      const year = parts.length >= 3 && parts[2] ? parts[2] : defaultYear;
      return new Date(year, month, day);
    }
  }

  return new Date(defaultYear, 0, 1);
}

/**
 * Converts JS Date day of week (0=Sun, 1=Mon, ..., 6=Sat) to our DayOfWeek (0=Mon, ..., 5=Sat).
 */
export function jsDayToDayOfWeek(jsDay: number): DayOfWeek {
  // Sunday (0) maps to 6 (Sunday), Mon (1)->0, Tue (2)->1, etc.
  const mapped = (jsDay + 6) % 7;
  return mapped as DayOfWeek;
}

/**
 * Computes the first date on or after `startDate` that falls on `targetDay`.
 */
export function getFirstOccurrenceDate(startDate: Date, targetDay: DayOfWeek): Date {
  const result = new Date(startDate.getTime());
  const currentDay = jsDayToDayOfWeek(result.getDay());

  // Calculate days offset until target day
  const diff = (targetDay - currentDay + 7) % 7;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * Formats a Date object into iCalendar ISO date-time string (YYYYMMDDTHHMMSS).
 */
export function formatICalDateTime(date: Date, timeStr?: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  let hh = String(date.getHours()).padStart(2, '0');
  let mm = String(date.getMinutes()).padStart(2, '0');
  let ss = String(date.getSeconds()).padStart(2, '0');

  if (timeStr && timeStr.includes(':')) {
    const parts = timeStr.split(':');
    hh = String(parts[0]).padStart(2, '0');
    mm = String(parts[1]).padStart(2, '0');
    ss = '00';
  }

  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string for the given export options.
 */
export function generateICalendarContent(options: ExportCalendarOptions): string {
  const defaultYear = new Date().getFullYear();
  const semesterStart = parseDate(options.startDate, defaultYear);
  const semesterEnd = parseDate(options.endDate, defaultYear);

  // Set semesterEnd time to 23:59:59 for UNTIL clause
  semesterEnd.setHours(23, 59, 59, 0);
  const untilIso = formatICalDateTime(semesterEnd);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OrganizadorCursada//UNQ Academic Organizer//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + sanitizeICalHeaderValue(options.planLabel || 'Cursada Universitaria'),
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
  ];

  for (const item of options.selectedEvents) {
    const { course, lesson } = item;
    const firstClassDate = getFirstOccurrenceDate(semesterStart, lesson.day);

    const dtStart = formatICalDateTime(firstClassDate, lesson.startTime);
    const dtEnd = formatICalDateTime(firstClassDate, lesson.endTime);

    const cleanLessonId = sanitizeICalHeaderValue(String(lesson.id));
    const summary = `${course.name} - ${lesson.professor ? 'Prof. ' + lesson.professor : 'Comisión'}`;
    const description = `Materia: ${course.name}\\nProfesor: ${lesson.professor || 'No especificado'}\\nPlan: ${options.planLabel || 'Organizador de Cursada'}`;
    const uid = `lesson-${cleanLessonId}-${firstClassDate.getTime()}@organizadorcursada.app`;
    const dayCode = ICAL_DAY_MAP[lesson.day] || 'MO';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilIso}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Sanitizes header values for iCalendar to prevent CRLF injection.
 */
export function sanitizeICalHeaderValue(text: string): string {
  if (!text) return '';
  return text.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Escapes text characters per RFC 5545 specifications, preventing CRLF injection.
 */
export function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n');
}

/**
 * Generates a direct Google Calendar Web URL for adding a single recurring lesson.
 */
export function generateGoogleCalendarWebUrl(
  item: CalendarEventItem,
  startDateStr: string,
  endDateStr: string,
  planLabel: string = 'Organizador Cursada',
): string {
  const defaultYear = new Date().getFullYear();
  const semesterStart = parseDate(startDateStr, defaultYear);
  const semesterEnd = parseDate(endDateStr, defaultYear);
  semesterEnd.setHours(23, 59, 59, 0);

  const { course, lesson } = item;
  const firstClassDate = getFirstOccurrenceDate(semesterStart, lesson.day);

  const dtStart = formatICalDateTime(firstClassDate, lesson.startTime);
  const dtEnd = formatICalDateTime(firstClassDate, lesson.endTime);
  const untilIso = formatICalDateTime(semesterEnd);

  const title = `${course.name} (${lesson.professor || 'Cursada'})`;
  const details = `Materia: ${course.name}\nProfesor: ${lesson.professor || 'No asignado'}\nPlan: ${planLabel}`;
  const dayCode = ICAL_DAY_MAP[lesson.day] || 'MO';
  const recurParam = `RRULE:FREQ=WEEKLY;BYDAY=${dayCode};UNTIL=${untilIso}`;

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    recur: recurParam,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Triggers a browser file download for a generated Blob.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/calendar'): void {
  if (typeof window === 'undefined' || !window.document) return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
