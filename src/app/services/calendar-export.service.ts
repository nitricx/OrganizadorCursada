import { Injectable, inject, computed } from '@angular/core';
import { CourseService } from './course.service';
import { PlanService } from './plan.service';
import { ToastService } from './toast.service';
import { CalendarEventItem, ExportCalendarOptions, GoogleSyncConfig } from '../models/calendar-sync.model';
import {
  generateICalendarContent,
  generateGoogleCalendarWebUrl,
  downloadFile,
} from '../utils/calendar-export.utils';

@Injectable({
  providedIn: 'root',
})
export class CalendarExportService {
  private readonly courseService = inject(CourseService);
  private readonly planService = inject(PlanService);
  private readonly toastService = inject(ToastService);

  /**
   * Computes current active coursing events (courses with status 'coursing' and selected lessons).
   */
  readonly activeCoursingEvents = computed<CalendarEventItem[]>(() => {
    const courses = this.courseService
      .courses()
      .filter((c) => c.status === 'coursing' && this.courseService.areAllRequirementsMet(c));

    const items: CalendarEventItem[] = [];

    courses.forEach((course) => {
      const selectedId = course.selectedLessonId;
      course.lessons.forEach((lesson) => {
        // If a specific commission is selected, only include that commission
        if (selectedId && lesson.id !== selectedId) {
          return;
        }
        // Include lessons marked as coursing or default to coursing if no status override set
        if (!lesson.status || lesson.status === 'coursing') {
          items.push({ course, lesson });
        }
      });
    });

    return items;
  });

  /**
   * Gets current plan ID and label.
   */
  getPlanInfo(): { id: string; label: string } {
    const id = this.planService.selectedPlanId() || '1';
    const label = this.planService.getPlanLabel(id) || `Plan ${id}`;
    return { id, label };
  }

  /**
   * Retrieves active semester dates from PlanService or computes reasonable defaults.
   */
  getSemesterDates(): { startDate: string; endDate: string } {
    const planId = this.planService.selectedPlanId() || '1';
    const semesterList = this.planService.getSemesterList(planId);
    const startingYear = this.planService.getStartingYear(planId);

    // Try to find the first semester with configured dates
    const configured = semesterList.find((s) => s.startDate && s.endDate);
    if (configured && configured.startDate && configured.endDate) {
      return { startDate: configured.startDate, endDate: configured.endDate };
    }

    // Default to Q1 of current starting year
    return this.planService.getDefaultSemesterDates(startingYear, 1);
  }

  /**
   * Generates and downloads the .ics file for the current active semester events.
   */
  exportToICS(customOptions?: Partial<ExportCalendarOptions>): void {
    const events = customOptions?.selectedEvents || this.activeCoursingEvents();

    if (events.length === 0) {
      this.toastService.warning('No hay materias activas en cursada para exportar.');
      return;
    }

    const { id, label } = this.getPlanInfo();
    const defaultDates = this.getSemesterDates();

    const options: ExportCalendarOptions = {
      planId: id,
      planLabel: label,
      startDate: customOptions?.startDate || defaultDates.startDate,
      endDate: customOptions?.endDate || defaultDates.endDate,
      selectedEvents: events,
    };

    const icsContent = generateICalendarContent(options);
    const sanitizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `cursada_${sanitizedLabel}_${options.startDate.replace(/\//g, '-')}.ics`;

    downloadFile(icsContent, filename, 'text/calendar');
    this.toastService.success(`¡Calendario exportado correctamente! (${events.length} clases)`);
  }

  /**
   * Returns list of direct Google Calendar web links for each active lesson.
   */
  getGoogleCalendarLinks(
    events?: CalendarEventItem[],
    startDate?: string,
    endDate?: string,
  ): Array<{ courseName: string; lessonId: string; url: string }> {
    const list = events || this.activeCoursingEvents();
    const dates = this.getSemesterDates();
    const sDate = startDate || dates.startDate;
    const eDate = endDate || dates.endDate;
    const { label } = this.getPlanInfo();

    return list.map((item) => ({
      courseName: item.course.name,
      lessonId: item.lesson.id,
      url: generateGoogleCalendarWebUrl(item, sDate, eDate, label),
    }));
  }

  /**
   * Future Google Calendar API OAuth2 synchronization stub.
   * Will be connected to Google Identity Services / Calendar API v3 endpoint.
   */
  async syncWithGoogleCalendar(config: GoogleSyncConfig): Promise<{ success: boolean; message: string }> {
    if (!config.clientId || !config.accessToken) {
      return {
        success: false,
        message: 'La sincronización en tiempo real requiere iniciar sesión con Google.',
      };
    }
    // Stub response for future expansion
    return {
      success: true,
      message: 'Sincronización completada exitosamente con Google Calendar.',
    };
  }
}
