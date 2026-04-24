import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  signal,
  NgZone,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { PlanService } from '../../services/plan.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Course } from '../../models/course';
import { Calendar } from '../calendar/calendar';

interface DisplaySemester {
  id: string;
  label: string;
  courses: Course[];
  year: number;
  q: number;
  courseYear: number;
  courseQ: number;
}

@Component({
  selector: 'app-academic-calendar',
  templateUrl: './academic-calendar.component.html',
  styleUrl: './academic-calendar.component.css',
  standalone: true,
  imports: [Calendar, CommonModule, MatIconModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicCalendarComponent {
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);
  private readonly ngZone = inject(NgZone);

  toastMessage = signal<string | null>(null);
  startingYear = signal<number>(new Date().getFullYear());
  isEditingTitle = signal<boolean>(false);
  editableTitle = signal<string>('Calendario Académico');
  editablePlanId = signal<string | null>(null);
  editableStartingYear = signal<number>(new Date().getFullYear());
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  private showToast(message: string): void {
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastTimeout = this.ngZone.runOutsideAngular(() =>
      setTimeout(() => this.ngZone.run(() => this.toastMessage.set(null)), 3500),
    );
  }

  private readonly routeParamId = toSignal(this.route.paramMap.pipe());

  private readonly currentRouteId = computed(() => this.routeParamId()?.get('id') ?? null);

  planId = computed(() => {
    const id = this.currentRouteId();
    return id ? (this.planService.getPlanLabel(id) ?? `Plan de estudio ${id}`) : null;
  });

  isEditable = computed(() => {
    const id = this.currentRouteId();
    return id !== null && id !== undefined && id !== '1';
  });

  constructor() {
    // Set the current plan ID and initialize semester list when route changes
    effect(() => {
      const id = this.currentRouteId();
      if (id) {
        // Cancel edit mode when route changes
        this.isEditingTitle.set(false);
        this.courseService.setCurrentPlanId(id);
        this.planService.setSelectedPlanId(id);
        this.startingYear.set(this.planService.getStartingYear(id));
        const stored = this.planService.getSemesterList(id);
        if (stored.length > 0) {
          this.semesterList.set(stored);
        } else {
          const courses = this.courseService.courses();
          const years = Array.from(new Set(courses.map((c) => c.year))).sort((a, b) => a - b);
          const base = years.flatMap((year) => [
            { id: `Y${year}Q1`, courseYear: year, courseQ: 1 },
            { id: `Y${year}Q2`, courseYear: year, courseQ: 2 },
          ]);
          this.semesterList.set(base);
          this.planService.setSemesterList(id, base);
        }
      }
    });
  }

  private readonly semesterList = signal<{ id: string; courseYear: number; courseQ: number }[]>([]);

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

      return {
        id: item.id,
        label: `Año ${displayYear} – Cuatrimestre ${displayQ}`,
        courses: semesterCourses,
        year: displayYear,
        q: displayQ,
        courseYear: item.courseYear,
        courseQ: item.courseQ,
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
      this.startingYear.set(yearValue);
      this.planService.setStartingYear(planId, yearValue);
    }
  }

  toggleEditTitle(): void {
    if (!this.isEditingTitle()) {
      // Entering edit mode - copy current values
      this.editableTitle.set('Calendario Académico');
      this.editablePlanId.set(this.planId());
      this.editableStartingYear.set(this.startingYear());
    }
    this.isEditingTitle.set(!this.isEditingTitle());
  }

  confirmEditTitle(): void {
    // Save the changes
    const newYear = this.editableStartingYear();
    const planId = this.currentRouteId();
    if (planId && newYear !== this.startingYear()) {
      this.startingYear.set(newYear);
      this.planService.setStartingYear(planId, newYear);
    }
    this.isEditingTitle.set(false);
  }

  cancelEditTitle(): void {
    // Restore previous values (they're not in signals, just discard editable versions)
    this.isEditingTitle.set(false);
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
          this.showToast(reason);
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
          this.showToast(reason);
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

    this.semesterList.update((list) => {
      const maxVirtualYear = list
        .filter((s) => s.courseYear >= 1000)
        .reduce((max, s) => Math.max(max, s.courseYear), 999);
      const virtualYear = maxVirtualYear + 1;

      const idx = list.findIndex((s) => s.id === id);
      const insertAt = idx >= 0 ? idx + 1 : list.length;
      const updated = [
        ...list.slice(0, insertAt),
        { id: id1, courseYear: virtualYear, courseQ: 1 },
        { id: id2, courseYear: virtualYear, courseQ: 2 },
        ...list.slice(insertAt),
      ];
      this.planService.setSemesterList(planId, updated);
      return updated;
    });
  }
}
