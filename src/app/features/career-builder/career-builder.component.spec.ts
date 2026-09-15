import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CareerBuilderComponent } from './career-builder.component';
import { RawCourseData } from '../../models/career.model';
import { ToastService } from '../../services/toast.service';
import { CareerService } from '../../services/career.service';

describe('CareerBuilderComponent', () => {
  let component: CareerBuilderComponent;
  let fixture: ComponentFixture<CareerBuilderComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}

    await TestBed.configureTestingModule({
      imports: [CareerBuilderComponent],
      providers: [provideRouter([{ path: '**', component: CareerBuilderComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(CareerBuilderComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should link subjects correctly in linking mode (first order)', () => {
    const course1: RawCourseData = {
      id: 101,
      name: 'Course 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    const course2: RawCourseData = {
      id: 102,
      name: 'Course 2',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    component.courses.set([course1, course2]);

    component.toggleConnectMode(); // Activate connect mode
    expect(component.isConnectMode()).toBe(true);

    // Source click
    component.handleCourseClick(course1);
    expect(component.connectSourceCourse()?.id).toBe(101);

    // Destination click
    component.handleCourseClick(course2);

    const updated2 = component.courses().find((c) => c.id === 102);
    expect(updated2?.cursarReqId).toEqual([101]);
    expect(updated2?.aprobarReqId).toEqual([]);
    expect(component.connectSourceCourse()).toBeNull();
  });

  it('should not allow linking the same subject twice as prerequisite', () => {
    const course1: RawCourseData = {
      id: 101,
      name: 'Course 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    const course2: RawCourseData = {
      id: 102,
      name: 'Course 2',
      year: 1,
      q: 2,
      cursarReqId: [101],
      aprobarReqId: [],
      lessons: [],
    };
    component.courses.set([course1, course2]);

    const warningSpy = vi.spyOn(toastService, 'warning');

    component.toggleConnectMode();
    component.handleCourseClick(course1); // Source
    component.handleCourseClick(course2); // Destination (already prerequisite)

    expect(warningSpy).toHaveBeenCalledWith(
      'La materia "Course 1" ya es correlativa de "Course 2".',
    );

    const updated2 = component.courses().find((c) => c.id === 102);
    expect(updated2?.cursarReqId).toEqual([101]);
    expect(updated2?.aprobarReqId).toEqual([]);
  });

  it('should detect circular cycle and reject linking', () => {
    const course1: RawCourseData = {
      id: 101,
      name: 'Course 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    const course2: RawCourseData = {
      id: 102,
      name: 'Course 2',
      year: 1,
      q: 1,
      cursarReqId: [101],
      aprobarReqId: [],
      lessons: [],
    };
    component.courses.set([course1, course2]);

    const warningSpy = vi.spyOn(toastService, 'warning');

    component.toggleConnectMode();
    component.handleCourseClick(course2); // Source: 102
    component.handleCourseClick(course1); // Destination: 101 (would create cycle 101 -> 102 -> 101)

    expect(warningSpy).toHaveBeenCalledWith(
      'No se puede vincular "Course 2" a "Course 1" porque generaría un ciclo de dependencia circular.',
    );

    const updated1 = component.courses().find((c) => c.id === 101);
    expect(updated1?.cursarReqId).toEqual([]);
    expect(updated1?.aprobarReqId).toEqual([]);
  });

  it('should not allow saving career plan if it contains circular references', () => {
    component.careerName.set('Carrera Circular');
    component.university.set('Universidad X');
    const course1: RawCourseData = {
      id: 101,
      name: 'Course 1',
      year: 1,
      q: 1,
      cursarReqId: [102],
      aprobarReqId: [],
      lessons: [],
    };
    const course2: RawCourseData = {
      id: 102,
      name: 'Course 2',
      year: 1,
      q: 1,
      cursarReqId: [101],
      aprobarReqId: [],
      lessons: [],
    };
    component.courses.set([course1, course2]);

    const warningSpy = vi.spyOn(toastService, 'warning');

    component.saveCareerPlan();

    expect(warningSpy).toHaveBeenCalledWith(
      'Se detectó una dependencia circular de correlativas entre las materias.',
    );
  });

  it('should not allow linking a subject as prerequisite if it is in a later year or semester', () => {
    const course1stYear: RawCourseData = {
      id: 101,
      name: 'Course 1st Year',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    const course3rdYear: RawCourseData = {
      id: 103,
      name: 'Course 3rd Year',
      year: 3,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [],
    };
    component.courses.set([course1stYear, course3rdYear]);

    const warningSpy = vi.spyOn(toastService, 'warning');

    component.toggleConnectMode();
    component.handleCourseClick(course3rdYear); // Source (3rd Year)
    component.handleCourseClick(course1stYear); // Destination (1st Year)

    expect(warningSpy).toHaveBeenCalledWith(
      'No se puede vincular "Course 3rd Year" como correlativa de "Course 1st Year" porque pertenece a un período posterior.',
    );

    const updated1st = component.courses().find((c) => c.id === 101);
    expect(updated1st?.cursarReqId).toEqual([]);
    expect(updated1st?.aprobarReqId).toEqual([]);
  });

  it('should load a subscribed study plan into the builder', () => {
    const plan = {
      id: 'ing-sistemas-test',
      name: 'Ingeniería Test',
      university: 'UTN',
      version: '1.0.0',
      courses: [
        {
          id: 1,
          name: 'Sistemas 1',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
      ],
    };

    component.loadPlanIntoBuilder(plan);

    expect(component.originalPlanId()).toBe('ing-sistemas-test');
    expect(component.careerName()).toBe('Ingeniería Test');
    expect(component.university()).toBe('UTN');
    expect(component.courses()).toHaveLength(1);
    expect(component.isEditingPlan()).toBe(true);
  });

  it('should generate a new custom copy when saving a modified standard plan', () => {
    const careerService = TestBed.inject(CareerService);
    const plan = {
      id: 'ing-sistemas',
      name: 'Ingeniería en Sistemas de Información',
      university: 'UTN',
      version: '1.0.0',
      courses: [
        {
          id: 1,
          name: 'Algoritmos',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
      ],
    };

    component.loadPlanIntoBuilder(plan);
    component.careerName.set('Mi Sistemas Personalizado');

    const saveSpy = vi.spyOn(careerService, 'saveCustomCareer');
    component.saveCareerPlan();

    expect(saveSpy).toHaveBeenCalled();
    const calls = saveSpy.mock.calls as [any][];
    const savedPlan = calls[0]?.[0];
    expect(savedPlan?.id?.startsWith('custom-career-')).toBe(true);
    expect(savedPlan?.name).toBe('Mi Sistemas Personalizado');
  });

  it('should retain the same ID when saving if the plan was already a user custom plan', () => {
    const careerService = TestBed.inject(CareerService);
    const plan = {
      id: 'custom-career-999',
      name: 'Mi Carrera Custom',
      university: 'UNLP',
      version: '1.0.0',
      courses: [
        {
          id: 1,
          name: 'Course Custom',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
      ],
    };

    component.loadPlanIntoBuilder(plan);
    component.university.set('UNLP Modificada');

    const saveSpy = vi.spyOn(careerService, 'saveCustomCareer');
    component.saveCareerPlan();

    expect(saveSpy).toHaveBeenCalled();
    const calls = saveSpy.mock.calls as [any][];
    const savedPlan = calls[0]?.[0];
    expect(savedPlan?.id).toBe('custom-career-999');
    expect(savedPlan?.university).toBe('UNLP Modificada');
  });
});
