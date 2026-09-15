import { TestBed } from '@angular/core/testing';
import { EntropyScorerService } from './entropy-scorer.service';
import { PlanManifest } from '../models/plan-manifest.model';

describe('EntropyScorerService (Exhaustive Test Suite)', () => {
  let service: EntropyScorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntropyScorerService);
  });

  it('should return low risk level for standard degree plans with 0 electives', () => {
    const manifest: PlanManifest = {
      id: 'standard1',
      name: 'Ingeniería en Sistemas',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Matemática I', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
        { id: 'c2', name: 'Física I', year: 1, q: 2, cursarReq: [], aprobarReq: [] },
      ],
    };

    const report = service.calculatePlanEntropy(manifest);
    expect(report.score).toBe(0);
    expect(report.riskLevel).toBe('low');
    expect(report.uniqueElectivesCount).toBe(0);
    expect(report.warnings).toHaveLength(0);
  });

  it('should detect high risk level when plan contains 4+ electives and multi-campus indicators', () => {
    const manifest: PlanManifest = {
      id: 'niche1',
      name: 'Diseño Audiovisual Niche',
      university: 'UNRN',
      version: '1.0.0',
      courses: [
        {
          id: 'c1',
          name: 'Course Electiva 1 Sede San Martín',
          year: 1,
          q: 1,
          cursarReq: [],
          aprobarReq: [],
        },
        { id: 'c2', name: 'Course Optativa 2', year: 1, q: 2, cursarReq: [], aprobarReq: [] },
        { id: 'c3', name: 'Course Optativa 3', year: 2, q: 1, cursarReq: [], aprobarReq: [] },
        {
          id: 'c4',
          name: 'Seminario Especial Optativo 4',
          year: 2,
          q: 2,
          cursarReq: [],
          aprobarReq: [],
        },
      ],
    };

    const report = service.calculatePlanEntropy(manifest);
    expect(report.score).toBeGreaterThanOrEqual(50);
    expect(report.riskLevel).toBe('high');
    expect(report.uniqueElectivesCount).toBe(4);
    expect(report.warnings.length).toBeGreaterThanOrEqual(2);
    expect(report.warnings.some((w) => w.includes('optativas'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('sede'))).toBe(true);
  });

  it('should flag high course volume when total courses exceed 55', () => {
    const courses = Array.from({ length: 60 }, (_, i) => ({
      id: `c${i}`,
      name: `Course ${i}`,
      year: Math.floor(i / 10) + 1,
      q: 1,
      cursarReq: [],
      aprobarReq: [],
    }));

    const manifest: PlanManifest = {
      id: 'huge1',
      name: 'Carrera Gigante',
      university: 'UNSAM',
      version: '1.0.0',
      courses,
    };

    const report = service.calculatePlanEntropy(manifest);
    expect(report.score).toBeGreaterThanOrEqual(20);
    expect(report.warnings.some((w) => w.includes('inusualmente elevado'))).toBe(true);
  });

  it('should handle null/undefined manifest gracefully', () => {
    const report = service.calculatePlanEntropy(null as any);
    expect(report.score).toBe(0);
    expect(report.riskLevel).toBe('low');
  });
});
