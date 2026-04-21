import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  effect,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { PlanService } from '../../services/plan.service';
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
  imports: [Calendar],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademicCalendarComponent {
  private readonly courseService = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly planService = inject(PlanService);

  private readonly routeParamId = toSignal(this.route.paramMap.pipe());

  planId = computed(() => {
    const id = this.routeParamId()?.get('id');
    return id ? `Plan de estudio ${id}` : null;
  });

  isEditable = computed(() => {
    const id = this.routeParamId()?.get('id');
    return id !== null && id !== undefined && id !== '1';
  });

  constructor() {
    // Update selected plan when route parameter changes
    effect(() => {
      const id = this.routeParamId()?.get('id');
      if (id) {
        this.planService.setSelectedPlanId(id);
        this.courseService.setCurrentPlanId(id);
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
    const courses = this.courseService.courses();

    return list.map((item, position) => {
      const displayYear = Math.floor(position / 2) + 1;
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

  onLessonMoveRequested(
    event: { lessonId: string; direction: 'next' | 'prev'; courseYear: number; courseQ: number },
    displayIndex: number,
  ): void {
    const semesters = this.displaySemesters();

    const delta = event.direction === 'next' ? 1 : -1;
    let searchIndex = displayIndex + delta;

    while (searchIndex >= 0 && searchIndex < semesters.length) {
      const candidate = semesters[searchIndex];
      if (candidate.q === event.courseQ) {
        this.courseService.moveLessonToSemester(
          event.lessonId,
          candidate.courseYear,
          candidate.courseQ,
        );
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
