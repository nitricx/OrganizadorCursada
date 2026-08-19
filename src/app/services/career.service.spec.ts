import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CareerService } from './career.service';

describe('CareerService', () => {
  let service: CareerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
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
          name: 'Materia 1',
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


  it('should import a valid custom JSON career plan successfully', () => {
    const customJson = JSON.stringify({
      id: 'custom-ing',
      name: 'Ingeniería Personalizada',
      university: 'Universidad Test',
      courses: [
        {
          id: 101,
          name: 'Programación 1',
          year: 1,
          q: 1,
          cursarReqId: [],
          aprobarReqId: [],
          lessons: [
            {
              id: 'P1-L1',
              professor: 'Prof. X',
              day: 1,
              startTime: '09:00',
              endTime: '12:00',
            },
          ],
        },
      ],
    });

    const result = service.importCareerFromJson(customJson);
    expect(result.success).toBe(true);
    expect(result.careerId).toBe('custom-ing');
    expect(service.selectedCareerId()).toBe('custom-ing');
    expect(service.activeCareer().name).toBe('Ingeniería Personalizada');
  });

  it('should return error when importing malformed JSON string', () => {
    const badJson = '{ invalid json string';
    const result = service.importCareerFromJson(badJson);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Error');
  });

  it('should remove a career and switch selected career to remaining career', () => {
    service.selectCareer('lic-diseno-audiovisual');
    expect(service.selectedCareerId()).toBe('lic-diseno-audiovisual');

    service.removeCareer('lic-diseno-audiovisual');
    expect(service.careers().some((c) => c.id === 'lic-diseno-audiovisual')).toBe(false);
    expect(service.selectedCareerId()).toBe('ing-sistemas');
  });

  it('should clear selected career when all careers are removed', () => {
    const initialCareers = [...service.careers()];
    initialCareers.forEach((c) => service.removeCareer(c.id));

    expect(service.careers().length).toBe(0);
    expect(service.selectedCareerId()).toBe('');
    expect(service.activeCareer().id).toBe('empty-plan');
  });
});
