import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CareerService } from './career.service';

describe('CareerService', () => {
  let service: CareerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.clear === 'function') {
        localStorage.clear();
      }
    } catch {}

    TestBed.configureTestingModule({
      providers: [CareerService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CareerService);
    httpMock = TestBed.inject(HttpTestingController);

    // Flush any pending HTTP requests initialized during service construction
    const openReqs = httpMock.match((r) => r.url.startsWith('/careers/'));
    openReqs.forEach((req) => req.error(new ProgressEvent('error')));
  });

  afterEach(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage && typeof localStorage.clear === 'function') {
        localStorage.clear();
      }
    } catch {}

    const openReqs = httpMock.match((r) => r.url.startsWith('/careers/'));
    openReqs.forEach((req) => req.error(new ProgressEvent('error')));
    httpMock.verify();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default empty career plan when unselected', () => {
    const active = service.activeCareer();
    expect(active).toBeTruthy();
    expect(active.id).toBe('empty-plan');
  });

  it('should select career ID and manage active career state', () => {
    service.selectCareer('ing-sistemas');
    expect(service.selectedCareerId()).toBe('ing-sistemas');
  });

  it('should validate a valid career plan', () => {
    const validPlan = {
      id: 'test-career',
      name: 'Carrera de Test',
      courses: [
        {
          id: 1,
          name: 'Course 1',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
      ],
    };
    expect(service.validateCareerPlan(validPlan)).toBe(true);
  });

  it('should reject invalid career plans', () => {
    expect(service.validateCareerPlan(null)).toBe(false);
    expect(service.validateCareerPlan({})).toBe(false);
    expect(service.validateCareerPlan({ id: 'test', name: 'Test' })).toBe(false); // missing courses array
    expect(
      service.validateCareerPlan({ id: 'test', name: 'Test', courses: [{ id: 'string-id' }] }),
    ).toBe(false); // invalid course id
  });



  it('should remove a career and switch selected career to remaining career', () => {
    service.addCareerFromManifest({ id: 'c1', name: 'Carrera 1', courses: [] });
    service.addCareerFromManifest({ id: 'c2', name: 'Carrera 2', courses: [] });

    service.selectCareer('c1');
    expect(service.selectedCareerId()).toBe('c1');

    service.removeCareer('c1');
    expect(service.careers().some((c) => c.id === 'c1')).toBe(false);
    expect(service.selectedCareerId()).toBe('c2');
  });

  it('should clear selected career when all careers are removed', () => {
    const initialCareers = [...service.careers()];
    initialCareers.forEach((c) => service.removeCareer(c.id));

    expect(service.careers().length).toBe(0);
    expect(service.selectedCareerId()).toBe('');
    expect(service.activeCareer().id).toBe('empty-plan');
  });

  it('should save custom career, persist in careers list and select it', () => {
    const customPlan = {
      id: 'custom-ing-soft',
      name: 'Ingeniería de Software',
      university: 'UNLP',
      courses: [
        {
          id: 1,
          name: 'Programación I',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [],
        },
      ],
    };

    const savedId = service.saveCustomCareer(customPlan);
    expect(savedId).toBe('custom-ing-soft');
    expect(service.selectedCareerId()).toBe('custom-ing-soft');
    expect(service.activeCareer().name).toBe('Ingeniería de Software');
    expect(service.careers().some((c) => c.id === 'custom-ing-soft')).toBe(true);
  });
});
