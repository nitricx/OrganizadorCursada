import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { CalendarExportService } from '../../../services/calendar-export.service';
import { ToastService } from '../../../services/toast.service';
import { CalendarEventItem } from '../../../models/calendar-sync.model';
import { ICAL_DAY_MAP } from '../../../utils/calendar-export.utils';

@Component({
  selector: 'app-export-calendar-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
  ],
  templateUrl: './export-calendar-modal.component.html',
  styleUrl: './export-calendar-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportCalendarModalComponent {
  private readonly exportService = inject(CalendarExportService);
  private readonly toastService = inject(ToastService);

  readonly close = output<void>();

  // State signals
  readonly activeEvents = computed(() => this.exportService.activeCoursingEvents());
  readonly planInfo = computed(() => this.exportService.getPlanInfo());

  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly selectedEventIds = signal<Set<string>>(new Set());

  constructor() {
    const dates = this.exportService.getSemesterDates();
    this.startDate.set(dates.startDate);
    this.endDate.set(dates.endDate);

    // Default: select all active events
    const initialEvents = this.activeEvents();
    const initialSet = new Set<string>();
    initialEvents.forEach((item) => initialSet.add(item.lesson.id));
    this.selectedEventIds.set(initialSet);
  }

  readonly filteredEvents = computed(() => {
    const selected = this.selectedEventIds();
    return this.activeEvents().filter((item) => selected.has(item.lesson.id));
  });

  readonly isAllSelected = computed(() => {
    const all = this.activeEvents();
    return all.length > 0 && this.selectedEventIds().size === all.length;
  });

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedEventIds.set(new Set());
    } else {
      const all = this.activeEvents();
      const next = new Set<string>();
      all.forEach((item) => next.add(item.lesson.id));
      this.selectedEventIds.set(next);
    }
  }

  toggleEvent(lessonId: string): void {
    this.selectedEventIds.update((set) => {
      const next = new Set(set);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  }

  getDayLabel(day: number): string {
    const map: Record<number, string> = {
      0: 'Lunes',
      1: 'Martes',
      2: 'Miércoles',
      3: 'Jueves',
      4: 'Viernes',
      5: 'Sábado',
    };
    return map[day] || 'Día';
  }

  exportICS(): void {
    const events = this.filteredEvents();
    if (events.length === 0) {
      this.toastService.warning('Selecciona al menos una materia para exportar.');
      return;
    }

    this.exportService.exportToICS({
      startDate: this.startDate(),
      endDate: this.endDate(),
      selectedEvents: events,
    });
    this.close.emit();
  }

  openGoogleCalendarLinks(): void {
    const events = this.filteredEvents();
    if (events.length === 0) {
      this.toastService.warning('Selecciona al menos una materia para abrir en Google Calendar.');
      return;
    }

    const links = this.exportService.getGoogleCalendarLinks(
      events,
      this.startDate(),
      this.endDate(),
    );

    if (links.length === 1) {
      window.open(links[0].url, '_blank');
      this.toastService.success('Abriendo clase en Google Calendar...');
    } else {
      // Open the first link and prompt user or offer download .ics for bulk
      window.open(links[0].url, '_blank');
      this.toastService.info(
        `Se abrió la primera materia. Para importar todas las ${links.length} materias de una vez, utiliza la opción "Descargar archivo .ics".`,
      );
    }
  }

  @HostListener('window:keydown.escape')
  onClose(): void {
    this.close.emit();
  }
}
