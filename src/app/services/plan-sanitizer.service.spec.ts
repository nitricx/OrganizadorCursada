import { TestBed } from '@angular/core/testing';
import { PlanSanitizerService } from './plan-sanitizer.service';

describe('PlanSanitizerService (Exhaustive Test Suite)', () => {
  let service: PlanSanitizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanSanitizerService);
  });

  it('should strip banned user progress keys and high-cardinality metadata', () => {
    const dangerousPayload = {
      id: 'plan1',
      name: 'Diseño Audiovisual',
      university: 'UNRN',
      cohort_year: 2024,
      classroom: 'Aula 4B',
      user_id: 'user_123',
      courses: [
        {
          id: 'mat101',
          name: 'Matemática I',
          year: 1,
          q: 1,
          status: 'approved',
          grade: 9,
          user_notes: 'Profesor exigente',
          cursarReq: [],
        },
      ],
    };

    const sanitized = service.sanitizeForPublishing(dangerousPayload);

    expect(sanitized.name).toBe('Diseño Audiovisual');
    expect(sanitized.courses).toHaveLength(1);
    expect((sanitized.courses[0] as any).status).toBeUndefined();
    expect((sanitized.courses[0] as any).user_notes).toBeUndefined();
    expect((sanitized.courses[0] as any).grade).toBeUndefined();
    expect((sanitized as any).cohort_year).toBeUndefined();
    expect((sanitized as any).classroom).toBeUndefined();
    expect((sanitized as any).user_id).toBeUndefined();
  });

  it('should format professor names to LASTNAME, I. stripping emails, titles, and phone numbers', () => {
    expect(service.sanitizeProfessorName('Dr. Juan Pérez juan@unsam.edu.ar')).toBe('PÉREZ, J.');
    expect(service.sanitizeProfessorName('Lic. Maria De Los Angeles Gonzalez')).toBe(
      'GONZALEZ, M.',
    );
    expect(service.sanitizeProfessorName('Prof. Carlos Smith +54 11 4455-6677')).toBe('SMITH, C.');
    expect(service.sanitizeProfessorName('SingleName')).toBe('SINGLENAME');
    expect(service.sanitizeProfessorName('')).toBe('');
  });

  it('should generalize physical location strings into standard time shifts', () => {
    expect(service.generalizeLocationString('Sede San Martín - Aula 4B - Turno Noche')).toBe(
      'Turno Noche',
    );
    expect(service.generalizeLocationString('Edificio Tornavías - Turno Mañana')).toBe(
      'Turno Mañana',
    );
    expect(service.generalizeLocationString('Turno Tarde Aula 12')).toBe('Turno Tarde');
    expect(service.generalizeLocationString('Campus Miguelete')).toBe('General');
    expect(service.generalizeLocationString('')).toBe('');
  });

  it('should strip potential HTML/script tags from titles', () => {
    const maliciousPayload = {
      id: 'plan_hack',
      name: 'Ingeniería <script>alert("hack")</script>',
      university: 'UNSAM <b style="color:red">Test</b>',
      courses: [],
    };

    const sanitized = service.sanitizeForPublishing(maliciousPayload);
    expect(sanitized.name).toBe('Ingeniería scriptalert("hack")/script');
    expect(sanitized.university).toBe('UNSAM b style="color:red"Test/b');
  });

  it('should throw an explicit error if raw payload is invalid', () => {
    expect(() => service.sanitizeForPublishing(null)).toThrowError(/Invalid plan payload/);
    expect(() => service.sanitizeForPublishing(undefined)).toThrowError(/Invalid plan payload/);
  });
});
