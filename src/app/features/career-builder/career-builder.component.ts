import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CareerService } from '../../services/career.service';
import { ToastService } from '../../services/toast.service';
import { CareerPlan, RawCourseData } from '../../models/career.model';

@Component({
  selector: 'app-career-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './career-builder.component.html',
  styleUrl: './career-builder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerBuilderComponent {
  private readonly careerService = inject(CareerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly careerName = signal<string>('');
  readonly university = signal<string>('');
  readonly faculty = signal<string>('');
  readonly totalYears = signal<number>(1);

  readonly courses = signal<RawCourseData[]>([]);

  // Modal / Form state for subject card (Caja aislada)
  readonly isModalOpen = signal<boolean>(false);
  readonly activeCourseId = signal<number | null>(null);
  readonly courseFormName = signal<string>('');
  readonly courseFormYear = signal<number>(1);
  readonly courseFormQ = signal<number>(1);

  readonly yearsArray = computed(() => {
    const count = Math.max(1, Math.min(10, this.totalYears()));
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  readonly totalCoursesCount = computed(() => this.courses().length);

  constructor() {
    // If there is an active career loaded, prefill if user is editing
    const active = this.careerService.activeCareer();
    if (active && active.id !== 'empty-plan' && active.id.startsWith('custom-')) {
      this.careerName.set(active.name || '');
      this.university.set(active.university || '');
      this.faculty.set(active.faculty || '');
      this.courses.set(active.courses || []);
      if (active.courses && active.courses.length > 0) {
        const maxY = Math.max(...active.courses.map((c) => c.year));
        this.totalYears.set(Math.max(1, maxY));
      }
    }
  }

  getCourses(year: number, q: number): RawCourseData[] {
    return this.courses().filter((c) => c.year === year && c.q === q);
  }

  openAddCourseModal(year: number = 1, q: number = 1): void {
    this.activeCourseId.set(null);
    this.courseFormName.set('');
    this.courseFormYear.set(year);
    this.courseFormQ.set(q);
    this.isModalOpen.set(true);
  }

  openEditCourseModal(course: RawCourseData, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeCourseId.set(course.id);
    this.courseFormName.set(course.name);
    this.courseFormYear.set(course.year);
    this.courseFormQ.set(course.q);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveCourse(): void {
    const name = this.courseFormName().trim();
    if (!name) {
      this.toastService.warning('Ingresá el nombre de la materia.');
      return;
    }

    const year = this.courseFormYear();
    const q = this.courseFormQ();

    if (year > this.totalYears()) {
      this.totalYears.set(year);
    }

    const existingId = this.activeCourseId();
    if (existingId !== null) {
      // Update existing course
      this.courses.update((list) =>
        list.map((c) => (c.id === existingId ? { ...c, name, year, q } : c)),
      );
      this.toastService.info(`Materia "${name}" actualizada.`);
    } else {
      // Add new course box
      const maxId = this.courses().reduce((max, c) => Math.max(max, c.id), 0);
      const newCourse: RawCourseData = {
        id: maxId + 1,
        name,
        year,
        q,
        cursarReqId: [],
        aprobarReqId: [],
        lessons: [],
      };
      this.courses.update((list) => [...list, newCourse]);
      this.toastService.success(`Materia "${name}" agregada.`);
    }

    this.closeModal();
  }

  deleteCourse(courseId: number, event?: Event): void {
    if (event) event.stopPropagation();
    const target = this.courses().find((c) => c.id === courseId);
    
    // Remove references to this course from other courses' prerequisites
    this.courses.update((list) =>
      list
        .filter((c) => c.id !== courseId)
        .map((c) => ({
          ...c,
          cursarReqId: c.cursarReqId.filter((id) => id !== courseId),
          aprobarReqId: c.aprobarReqId.filter((id) => id !== courseId),
        })),
    );

    if (this.isModalOpen()) {
      this.closeModal();
    }

    if (target) {
      this.toastService.info(`Materia "${target.name}" eliminada.`);
    }
  }

  updateTotalYears(delta: number): void {
    const next = this.totalYears() + delta;
    if (next >= 1 && next <= 10) {
      this.totalYears.set(next);
    }
  }

  addNextYear(): void {
    if (this.totalYears() < 10) {
      this.totalYears.update((y) => y + 1);
      this.toastService.info(`Año ${this.totalYears()} agregado.`);
    }
  }

  getCourseById(id: number): RawCourseData | undefined {
    return this.courses().find((c) => c.id === id);
  }

  getCourseNameById(id: number): string {
    const course = this.getCourseById(id);
    return course ? course.name : `Materia #${id}`;
  }

  saveCareerPlan(): void {
    const name = this.careerName().trim();
    if (!name) {
      this.toastService.warning('Ingresá el nombre de la carrera.');
      return;
    }

    const university = this.university().trim();
    if (!university) {
      this.toastService.warning('Ingresá la universidad o institución a la que corresponde la carrera.');
      return;
    }

    if (this.courses().length === 0) {
      this.toastService.warning('Agregá al menos una materia para poder guardar la carrera.');
      return;
    }

    const active = this.careerService.activeCareer();
    const isEditingCustom = active && active.id !== 'empty-plan' && active.id.startsWith('custom-');

    const planId = isEditingCustom ? active.id : `custom-career-${Date.now()}`;

    const plan: CareerPlan = {
      id: planId,
      name,
      university,
      faculty: this.faculty().trim() || undefined,
      version: '1.0.0',
      courses: this.courses(),
    };

    this.careerService.saveCustomCareer(plan);
    this.toastService.success(`¡Carrera "${name}" guardada con éxito!`);
    void this.router.navigateByUrl('/home');
  }

  cancel(): void {
    void this.router.navigateByUrl('/home');
  }
}
