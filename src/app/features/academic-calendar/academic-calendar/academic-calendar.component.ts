import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../services/course.service';
import { PlanService } from '../../../services/plan.service';
import { ToastService } from '../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Course } from '../../../models/course';
import { Calendar } from '../../schedule/calendar/calendar';
import { ExportCalendarModalComponent } from '../../schedule/export-calendar-modal/export-calendar-modal.component';

import { NoPlanSelectedComponent } from '../../../shared/components/no-plan-selected/no-plan-selected.component';

import { CareerService } from '../../../services/career.service';

interface DisplaySemester {
  id: string;
  label: string;
  courses: Course[];
  year: number;
  q: number;
  courseYear: number;
  courseQ: number;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-academic-calendar',
  templateUrl: './academic-calendar.component.html',
  styleUrl: './academic-calendar.component.css',
  standalone: true,
  imports: [
    Calendar,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ExportCalendarModalComponent,
    NoPlanSelectedComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicCalendarComponent {
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly careerService = inject(CareerService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly plans = this.planService.plans;
  readonly showExportModal = signal<boolean>(false);

  openExportModal(): void {
    this.showExportModal.set(true);
  }

  closeExportModal(): void {
    this.showExportModal.set(false);
  }

  startingYear = computed(() => {
    const id = this.currentRouteId();
    return id ? this.planService.getStartingYear(id) : new Date().getFullYear();
  });
  isEditingTitle = signal<boolean>(false);
  editableTitle = signal<string>('Calendario Académico');
  editablePlanId = signal<string | null>(null);
  editableStartingYear = signal<number>(new Date().getFullYear());
  editableSemesterDates = signal<Map<string, { startDate?: string; endDate?: string }>>(new Map());

  private readonly routeParamId = toSignal(this.route.paramMap.pipe());

  readonly currentRouteId = computed(() => this.routeParamId()?.get('id') ?? null);

  planId = computed(() => {
    const id = this.currentRouteId();
    return id ? (this.planService.getPlanLabel(id) ?? `Plan de estudio ${id}`) : null;
  });

  isEditable = computed(() => {
    const id = this.currentRouteId();
    return id !== null && id !== undefined && id !== '1';
  });

  readonly hasSelectedPlan = computed(() => {
    const id = this.currentRouteId();
    if (!id) return false;
    const plans = this.planService.plans();
    if (plans.length > 0) {
      return plans.some((p) => p.id === id);
    }
    return this.courseService.hasSelectedPlan() || this.courseService.getCoursesForPlan(id).length > 0;
  });

  constructor() {
    // Set the current plan ID and initialize semester list when route changes
    effect(() => {
      const id = this.currentRouteId();
      let plans = this.planService.plans();

      if (plans.length === 0) {
        untracked(() => {
          const careerName = this.careerService.activeCareer().name;
          const label = careerName && careerName !== 'Sin Plan' ? careerName : 'Calendario Oficial';
          this.planService.addPlan({ id: '1', label });
        });
        plans = this.planService.plans();
      }

      if (!id && plans.length > 0) {
        void this.router.navigateByUrl(`/academicCalendar/plan/${plans[0].id}`, { replaceUrl: true });
        return;
      }
      if (id) {
        // Cancel edit mode when route changes
        this.isEditingTitle.set(false);
        untracked(() => {
          this.courseService.setCurrentPlanId(id);
          this.planService.setSelectedPlanId(id);
          const stored = this.planService.getSemesterList(id);
          if (stored.length === 0) {
            const courses: Course[] = this.courseService.getCoursesForPlan(id);
            const yearsFromCourses = Array.from(new Set(courses.map((c) => c.year))).sort((a, b) => a - b);
            const years = yearsFromCourses.length > 0 ? yearsFromCourses : [1, 2, 3, 4, 5];
            const startingYear = this.planService.getStartingYear(id);
            const base = years.flatMap((year) => [
              {
                id: `Y${year}Q1`,
                courseYear: year,
                courseQ: 1,
                ...this.planService.getDefaultSemesterDates(startingYear, 1),
              },
              {
                id: `Y${year}Q2`,
                courseYear: year,
                courseQ: 2,
                ...this.planService.getDefaultSemesterDates(startingYear, 2),
              },
            ]);
            this.planService.setSemesterList(id, base);
          }
        });
      }
    });
  }


  semesterList = computed(() => {
    const id = this.currentRouteId();
    return id ? this.planService.getSemesterList(id) : [];
  });

  displaySemesters = computed<DisplaySemester[]>(() => {
    const list = this.semesterList();
    const routeId = this.currentRouteId();
    const starting = this.startingYear();
    // Read directly from the plan by route ID, bypassing the async currentPlanIdSignal
    const courses = routeId ? this.courseService.getCoursesForPlan(routeId) : [];

    return list.map((item, position) => {
      const displayYear = starting + Math.floor(position / 2);
      const displayQ = (position % 2) + 1;
      const semesterCourses =
        item.courseYear > 0
          ? courses.filter((c) => c.year === item.courseYear && (c.q === item.courseQ || c.q === 3))
          : [];

      const label =
        item.startDate && item.endDate
          ? `Año ${displayYear} – Cuatrimestre ${displayQ} (${item.startDate} - ${item.endDate})`
          : `Año ${displayYear} – Cuatrimestre ${displayQ}`;

      return {
        id: item.id,
        label,
        courses: semesterCourses,
        year: displayYear,
        q: displayQ,
        courseYear: item.courseYear,
        courseQ: item.courseQ,
        startDate: item.startDate,
        endDate: item.endDate,
      };
    });
  });

  setStartingYear(year: number | Event): void {
    let yearValue: number;
    if (year instanceof Event) {
      const target = year.target as HTMLInputElement;
      yearValue = parseInt(target.value, 10);
    } else {
      yearValue = year;
    }
    const planId = this.currentRouteId();
    if (planId && !isNaN(yearValue)) {
      this.planService.setStartingYear(planId, yearValue);
    }
  }

  toggleEditTitle(): void {
    if (!this.isEditingTitle()) {
      // Entering edit mode - copy current values
      this.editableTitle.set('Calendario Académico');
      this.editablePlanId.set(this.planId());
      this.editableStartingYear.set(this.startingYear());
      // Copy semester dates into editable map
      const dateMap = new Map<string, { startDate?: string; endDate?: string }>();
      this.semesterList().forEach((sem) => {
        dateMap.set(sem.id, { startDate: sem.startDate, endDate: sem.endDate });
      });
      this.editableSemesterDates.set(dateMap);
    }
    this.isEditingTitle.set(!this.isEditingTitle());
  }

  confirmEditTitle(): void {
    const newLabel = this.editablePlanId();
    const newYear = this.editableStartingYear();
    const planId = this.currentRouteId();

    if (planId && newLabel && newLabel !== this.planId()) {
      this.planService.updatePlanLabel(planId, newLabel);
    }

    if (planId && newYear !== this.startingYear()) {
      this.planService.setStartingYear(planId, newYear);
    }

    // Update semester dates from editable map
    const dateMap = this.editableSemesterDates();
    if (dateMap.size > 0 && planId) {
      const currentList = this.semesterList();
      const updated = currentList.map((sem) => {
        const dates = dateMap.get(sem.id);
        return dates ? { ...sem, startDate: dates.startDate, endDate: dates.endDate } : sem;
      });
      this.planService.setSemesterList(planId, updated);
    }

    this.isEditingTitle.set(false);
  }

  cancelEditTitle(): void {
    // Restore previous values (they're not in signals, just discard editable versions)
    this.isEditingTitle.set(false);
  }

  updateSemesterDate(semesterId: string, field: 'startDate' | 'endDate', value: string): void {
    this.editableSemesterDates.update((map) => {
      const dates = map.get(semesterId) || {};
      const updated = new Map(map);
      updated.set(semesterId, { ...dates, [field]: value });
      return updated;
    });
  }

  getEditableSemesterDates(semesterId: string): { startDate?: string; endDate?: string } {
    return this.editableSemesterDates().get(semesterId) || {};
  }

  onLessonMoveRequested(
    event: { lessonId: string; direction: 'next' | 'prev'; courseYear: number; courseQ: number },
    displayIndex: number,
  ): void {
    const semesters = this.displaySemesters();
    const delta = event.direction === 'next' ? 1 : -1;
    const isAnnual = event.courseQ === 3;

    if (isAnnual) {
      // Annual courses span both quarters of a year — find Q1 of the adjacent year
      const candidates = semesters.filter(
        (s) =>
          s.courseQ === 1 &&
          (delta === 1 ? s.courseYear > event.courseYear : s.courseYear < event.courseYear),
      );
      const target = delta === 1 ? candidates[0] : candidates[candidates.length - 1];
      if (target) {
        const reason = this.courseService.getMoveBlockReason(event.lessonId, target.courseYear);
        if (reason) {
          this.toastService.warning(reason);
        } else {
          this.courseService.moveLessonToSemester(event.lessonId, target.courseYear, 3);
        }
      }
      return;
    }

    let searchIndex = displayIndex + delta;
    while (searchIndex >= 0 && searchIndex < semesters.length) {
      const candidate = semesters[searchIndex];
      if (candidate.q === event.courseQ) {
        const reason = this.courseService.getMoveBlockReason(event.lessonId, candidate.courseYear);
        if (reason) {
          this.toastService.warning(reason);
        } else {
          this.courseService.moveLessonToSemester(
            event.lessonId,
            candidate.courseYear,
            candidate.courseQ,
          );
        }
        return;
      }
      searchIndex += delta;
    }
  }

  addCalendarAfter(id: string): void {
    const planId = this.routeParamId()?.get('id');
    if (!planId) {
      console.warn('No plan ID available');
      return;
    }

    const ts = Date.now();
    const id1 = `extra-${ts}-1`;
    const id2 = `extra-${ts}-2`;

    const list = this.semesterList();
    const maxVirtualYear = list
      .filter((s) => s.courseYear >= 1000)
      .reduce((max, s) => Math.max(max, s.courseYear), 999);
    const virtualYear = maxVirtualYear + 1;

    const idx = list.findIndex((s) => s.id === id);
    const insertAt = idx >= 0 ? idx + 1 : list.length;
    const year = this.startingYear();
    const updated = [
      ...list.slice(0, insertAt),
      {
        id: id1,
        courseYear: virtualYear,
        courseQ: 1,
        ...this.planService.getDefaultSemesterDates(year, 1),
      },
      {
        id: id2,
        courseYear: virtualYear,
        courseQ: 2,
        ...this.planService.getDefaultSemesterDates(year, 2),
      },
      ...list.slice(insertAt),
    ];
    this.planService.setSemesterList(planId, updated);
  }

  deletePlan(): void {
    const planId = this.currentRouteId();
    if (!planId || planId === '1') return;

    this.courseService.deletePlan(planId);
    this.planService.deletePlan(planId);
    this.toastService.info('Calendario local eliminado');

    const remaining = this.planService.plans();
    const fallback = remaining.length > 0 ? `/academicCalendar/plan/${remaining[0].id}` : '/academicCalendar/plan/1';
    void this.router.navigateByUrl(fallback);
  }

  addCalendarPlan(): void {
    const activeCareer = this.careerService.activeCareer();
    if (!activeCareer || activeCareer.id === 'empty-plan') {
      this.toastService.warning(
        'Seleccioná un plan de estudio en el menú superior o en el Plan Hub para poder agregar un calendario personal.',
      );
      this.planService.openWorkshop();
      return;
    }

    const existingIds = this.planService
      .plans()
      .map((p) => Number(p.id))
      .filter((n) => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const labelNumber = this.planService.plans().length;
    const newPlanId = nextId.toString();
    const newPlan = { id: newPlanId, label: `Calendario Personal ${labelNumber}` };
    this.planService.addPlan(newPlan);
    this.toastService.success('Nuevo calendario personal creado');
    void this.router.navigateByUrl(`/academicCalendar/plan/${newPlanId}`);
  }

  selectPlan(planId: string): void {
    void this.router.navigateByUrl(`/academicCalendar/plan/${planId}`);
  }

  getPlanDisplayName(plan: { id: string; label: string }): string {
    if (plan.id === '1') {
      const activeCareerName = this.careerService.activeCareer().name;
      if (activeCareerName && activeCareerName !== 'Sin Plan') {
        return activeCareerName;
      }
      return 'Calendario Oficial';
    }
    return plan.label || `Calendario ${plan.id}`;
  }
}

