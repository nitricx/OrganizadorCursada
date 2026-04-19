import { Component, ChangeDetectionStrategy, inject, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { PlanService } from '../../services/plan.service';
import { Course } from '../../models/course';
import { Calendar } from '../calendar/calendar';

interface Semester {
  label: string;
  courses: Course[];
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

  constructor() {
    // Update selected plan when route parameter changes
    effect(() => {
      const id = this.routeParamId()?.get('id');
      if (id) {
        this.planService.setSelectedPlanId(id);
      }
    });
  }

  semesters = computed<Semester[]>(() => {
    const courses = this.courseService.courses();

    const semesters: Semester[] = [];

    // Group by year, then by quarter (1, 2, 3)
    const years = Array.from(new Set(courses.map((c) => c.year))).sort((a, b) => a - b);

    years.forEach((year) => {
      const yearCourses = courses.filter((c) => c.year === year);
      const hasNonAnnualCourses = yearCourses.some((c) => c.q < 3);

      [1, 2, 3].forEach((q) => {
        // Skip the annual section if this year has q:1 or q:2 courses
        if (q === 3 && hasNonAnnualCourses) {
          return;
        }

        const quarterLabel = q === 3 ? 'Anual' : `Cuatrimestre ${q}`;
        const semesterCourses = yearCourses.filter((c) => c.q === q || (q < 3 && c.q === 3));

        if (semesterCourses.length > 0) {
          semesters.push({
            label: `Año ${year} – ${quarterLabel}`,
            courses: semesterCourses,
          });
        }
      });
    });

    return semesters;
  });
}
