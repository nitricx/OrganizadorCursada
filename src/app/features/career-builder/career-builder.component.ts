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
import { Lesson, DayOfWeek } from '../../models/course';

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

  // Hover state (para resaltar Requisito / Desbloquea como en /home)
  readonly hoveredCourseId = signal<number | null>(null);

  // Connect Mode State (Opción B: Clic Origen -> Clic Destino)
  readonly isConnectMode = signal<boolean>(false);
  readonly connectSourceCourse = signal<RawCourseData | null>(null);
  readonly connectTargetCourse = signal<RawCourseData | null>(null);

  // Modal / Form state for subject card
  readonly isModalOpen = signal<boolean>(false);
  readonly activeCourseId = signal<number | null>(null);
  readonly courseFormName = signal<string>('');
  readonly courseFormYear = signal<number>(1);
  readonly courseFormQ = signal<number>(1);
  readonly courseFormLessons = signal<Lesson[]>([]);

  readonly daysOfWeekList = [
    { value: DayOfWeek.Monday, label: 'Lunes' },
    { value: DayOfWeek.Tuesday, label: 'Martes' },
    { value: DayOfWeek.Wednesday, label: 'Miércoles' },
    { value: DayOfWeek.Thursday, label: 'Jueves' },
    { value: DayOfWeek.Friday, label: 'Viernes' },
    { value: DayOfWeek.Saturday, label: 'Sábado' },
  ];

  readonly yearsArray = computed(() => {
    const count = Math.max(1, Math.min(10, this.totalYears()));
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  readonly totalCoursesCount = computed(() => this.courses().length);

  // Computed set of required courses (Upstream / Requisitos) for currently hovered course
  readonly hoveredRequiredSet = computed<Set<number>>(() => {
    const hoveredId = this.hoveredCourseId();
    if (hoveredId === null) return new Set<number>();

    const allCourses = this.courses();
    const reqSet = new Set<number>();
    const queue = [hoveredId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = allCourses.find((c) => c.id === currentId);
      if (current) {
        const parents = [...(current.cursarReqId || []), ...(current.aprobarReqId || [])];
        parents.forEach((pId) => {
          if (!reqSet.has(pId)) {
            reqSet.add(pId);
            queue.push(pId);
          }
        });
      }
    }
    return reqSet;
  });

  // Computed set of unlocked courses (Downstream / Desbloquea) for currently hovered course
  readonly hoveredUnlockedSet = computed<Set<number>>(() => {
    const hoveredId = this.hoveredCourseId();
    if (hoveredId === null) return new Set<number>();

    const allCourses = this.courses();
    const unlockSet = new Set<number>();
    const queue = [hoveredId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = allCourses.filter(
        (c) => (c.cursarReqId || []).includes(currentId) || (c.aprobarReqId || []).includes(currentId),
      );
      children.forEach((child) => {
        if (!unlockSet.has(child.id)) {
          unlockSet.add(child.id);
          queue.push(child.id);
        }
      });
    }
    return unlockSet;
  });

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

  onCourseMouseEnter(courseId: number): void {
    this.hoveredCourseId.set(courseId);
  }

  onCourseMouseLeave(): void {
    this.hoveredCourseId.set(null);
  }

  getCourseCardClass(course: RawCourseData): string {
    const source = this.connectSourceCourse();
    if (source && source.id === course.id) {
      return 'connecting-source';
    }

    const hoveredId = this.hoveredCourseId();
    if (hoveredId !== null) {
      if (hoveredId === course.id) {
        return 'hovered-self';
      }
      if (this.hoveredRequiredSet().has(course.id)) {
        return 'is-req';
      }
      if (this.hoveredUnlockedSet().has(course.id)) {
        return 'is-unlocks';
      }
      return 'is-dimmed';
    }

    return '';
  }

  // --- Connect Mode Logic ---

  toggleConnectMode(): void {
    const nextState = !this.isConnectMode();
    this.isConnectMode.set(nextState);
    this.cancelConnection();

    if (nextState) {
      this.toastService.info('Modo Vinculación activo: Hacé clic en la materia requisito (Origen).');
    } else {
      this.toastService.info('Modo Vinculación desactivado.');
    }
  }

  cancelConnection(): void {
    this.connectSourceCourse.set(null);
    this.connectTargetCourse.set(null);
  }

  hasIntermediatePath(sourceId: number, targetId: number): boolean {
    const courses = this.courses();

    const directChildren = courses.filter(
      (c) => (c.cursarReqId || []).includes(sourceId) || (c.aprobarReqId || []).includes(sourceId),
    );

    const queue: number[] = directChildren.map((c) => c.id);
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === targetId) {
        return true;
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const nextChildren = courses.filter(
        (c) => (c.cursarReqId || []).includes(currentId) || (c.aprobarReqId || []).includes(currentId),
      );
      nextChildren.forEach((child) => {
        if (!visited.has(child.id)) {
          queue.push(child.id);
        }
      });
    }

    return false;
  }

  getPrerequisiteType(sourceId: number, targetId: number): 'cursar' | 'aprobar' {
    return this.hasIntermediatePath(sourceId, targetId) ? 'aprobar' : 'cursar';
  }

  handleCourseClick(course: RawCourseData, event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.isConnectMode()) {
      this.openEditCourseModal(course);
      return;
    }

    const source = this.connectSourceCourse();

    if (!source) {
      this.connectSourceCourse.set(course);
      this.toastService.info(`Seleccionaste "${course.name}" (Origen). Ahora hacé clic en la materia que la requiere (Destino).`);
      return;
    }

    if (source.id === course.id) {
      this.cancelConnection();
      this.toastService.info('Selección de vinculación cancelada.');
      return;
    }

    if (this.wouldCreateCycle(source.id, course.id)) {
      this.toastService.warning(`No se puede vincular "${source.name}" a "${course.name}" porque generaría un ciclo de dependencia circular.`);
      return;
    }

    const type = this.getPrerequisiteType(source.id, course.id);
    const isSecondOrder = type === 'aprobar';

    this.courses.update((list) =>
      list.map((c) => {
        if (c.id !== course.id) return c;
        const cursarReqId = type === 'cursar' ? Array.from(new Set([...c.cursarReqId, source.id])) : c.cursarReqId;
        const aprobarReqId = type === 'aprobar' ? Array.from(new Set([...c.aprobarReqId, source.id])) : c.aprobarReqId;
        return { ...c, cursarReqId, aprobarReqId };
      }),
    );

    const orderText = isSecondOrder
      ? '2º orden (encadenada vía materia intermedia -> requiere examen final)'
      : '1º orden (directa -> requiere solo cursada)';
    this.toastService.success(`Correlatividad de ${orderText} establecida: "${source.name}" -> "${course.name}".`);

    this.cancelConnection();
  }

  wouldCreateCycle(reqId: number, targetCourseId: number): boolean {
    if (reqId === targetCourseId) return true;
    const courses = this.courses();
    const queue = [reqId];
    const visited = new Set<number>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetCourseId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const currentCourse = courses.find((c) => c.id === current);
      if (currentCourse) {
        const nextIds = [...currentCourse.cursarReqId, ...currentCourse.aprobarReqId];
        queue.push(...nextIds);
      }
    }
    return false;
  }

  removePrerequisite(targetCourseId: number, reqId: number, type: 'cursar' | 'aprobar', event?: Event): void {
    if (event) event.stopPropagation();

    this.courses.update((list) =>
      list.map((c) => {
        if (c.id !== targetCourseId) return c;
        const cursarReqId = type === 'cursar' ? c.cursarReqId.filter((id) => id !== reqId) : c.cursarReqId;
        const aprobarReqId = type === 'aprobar' ? c.aprobarReqId.filter((id) => id !== reqId) : c.aprobarReqId;
        return { ...c, cursarReqId, aprobarReqId };
      }),
    );

    this.toastService.info('Correlatividad eliminada.');
  }

  // --- Modal & Course Management ---

  openAddCourseModal(year: number = 1, q: number = 1): void {
    this.activeCourseId.set(null);
    this.courseFormName.set('');
    this.courseFormYear.set(year);
    this.courseFormQ.set(q);
    this.courseFormLessons.set([]);
    this.isModalOpen.set(true);
  }

  openEditCourseModal(course: RawCourseData, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeCourseId.set(course.id);
    this.courseFormName.set(course.name);
    this.courseFormYear.set(course.year);
    this.courseFormQ.set(course.q);
    this.courseFormLessons.set(
      course.lessons ? course.lessons.map((l) => ({ ...l })) : [],
    );
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  // --- Commission / Lesson Form Management ---

  addLessonFormRow(): void {
    const activeId = this.activeCourseId() || Date.now();
    const current = this.courseFormLessons();
    const newLesson: Lesson = {
      id: `L-${activeId}-${current.length + 1}`,
      professor: '',
      day: DayOfWeek.Monday,
      startTime: '08:00',
      endTime: '12:00',
    };
    this.courseFormLessons.set([...current, newLesson]);
  }

  removeLessonFormRow(index: number): void {
    this.courseFormLessons.update((list) => list.filter((_, i) => i !== index));
  }

  updateLessonField<K extends keyof Lesson>(index: number, key: K, value: Lesson[K]): void {
    this.courseFormLessons.update((list) =>
      list.map((l, i) => (i === index ? { ...l, [key]: value } : l)),
    );
  }

  saveCourse(): void {
    const name = this.courseFormName().trim();
    if (!name) {
      this.toastService.warning('Ingresá el nombre de la materia.');
      return;
    }

    const year = this.courseFormYear();
    const q = this.courseFormQ();
    const lessons = this.courseFormLessons();

    if (year > this.totalYears()) {
      this.totalYears.set(year);
    }

    const existingId = this.activeCourseId();
    if (existingId !== null) {
      // Update existing course
      this.courses.update((list) =>
        list.map((c) => (c.id === existingId ? { ...c, name, year, q, lessons } : c)),
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
        lessons,
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

  getUnlockedCourses(courseId: number): { course: RawCourseData; type: 'cursar' | 'aprobar' }[] {
    const all = this.courses();
    const result: { course: RawCourseData; type: 'cursar' | 'aprobar' }[] = [];

    for (const c of all) {
      if (c.cursarReqId.includes(courseId)) {
        result.push({ course: c, type: 'cursar' });
      }
      if (c.aprobarReqId.includes(courseId)) {
        result.push({ course: c, type: 'aprobar' });
      }
    }

    return result;
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
