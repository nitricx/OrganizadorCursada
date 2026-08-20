import { TestBed } from '@angular/core/testing';
import { PlanLinterService } from './plan-linter.service';
import { PlanManifest } from '../models/plan-manifest.model';

describe('PlanLinterService (Exhaustive Test Suite)', () => {
  let service: PlanLinterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanLinterService);
  });

  it('should pass linting for a valid DAG prerequisite structure (Diamond Graph)', () => {
    // Diamond graph: C1 -> C2, C1 -> C3, C2 -> C4, C3 -> C4
    const validManifest: PlanManifest = {
      id: 'valid_diamond',
      name: 'Plan Diamante Válido',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Materia 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
        { id: 'c2', name: 'Materia 2', year: 1, q: 2, cursarReq: ['c1'], aprobarReq: [] },
        { id: 'c3', name: 'Materia 3', year: 1, q: 2, cursarReq: ['c1'], aprobarReq: [] },
        { id: 'c4', name: 'Materia 4', year: 2, q: 1, cursarReq: ['c2', 'c3'], aprobarReq: [] }
      ]
    };

    const res = service.lintPlanManifest(validManifest);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('should detect 2-node circular prerequisite dependencies (A -> B -> A)', () => {
    const cyclicManifest: PlanManifest = {
      id: 'cyclic2',
      name: 'Ciclo 2 Nodos',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Materia 1', year: 1, q: 1, cursarReq: ['c2'], aprobarReq: [] },
        { id: 'c2', name: 'Materia 2', year: 1, q: 2, cursarReq: ['c1'], aprobarReq: [] }
      ]
    };

    const res = service.lintPlanManifest(cyclicManifest);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('circular'))).toBe(true);
  });

  it('should detect 3-node circular prerequisite dependencies (A -> B -> C -> A)', () => {
    const cyclicManifest: PlanManifest = {
      id: 'cyclic3',
      name: 'Ciclo 3 Nodos',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Materia 1', year: 1, q: 1, cursarReq: ['c3'], aprobarReq: [] },
        { id: 'c2', name: 'Materia 2', year: 1, q: 2, cursarReq: ['c1'], aprobarReq: [] },
        { id: 'c3', name: 'Materia 3', year: 2, q: 1, cursarReq: ['c2'], aprobarReq: [] }
      ]
    };

    const res = service.lintPlanManifest(cyclicManifest);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('circular'))).toBe(true);
  });

  it('should detect dangling prerequisite references to non-existent courses', () => {
    const danglingManifest: PlanManifest = {
      id: 'dangling1',
      name: 'Plan Incompleto',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Materia 1', year: 1, q: 1, cursarReq: ['c_ghost'], aprobarReq: [] }
      ]
    };

    const res = service.lintPlanManifest(danglingManifest);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('inexistente'))).toBe(true);
  });

  it('should reject plans exceeding maximum course bounds (> 200 courses) or max years (> 15 years)', () => {
    const hugeCourses = Array.from({ length: 205 }, (_, i) => ({
      id: `c${i}`,
      name: `Materia ${i}`,
      year: 20, // 20 years exceeds max 15 years limit
      q: 1,
      cursarReq: [],
      aprobarReq: []
    }));

    const hugeManifest: PlanManifest = {
      id: 'too_big',
      name: 'Plan Excesivo',
      university: 'UNSAM',
      version: '1.0.0',
      courses: hugeCourses
    };

    const res = service.lintPlanManifest(hugeManifest);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('límite máximo'))).toBe(true);
    expect(res.errors.some(e => e.includes('límite razonable de años'))).toBe(true);
  });

  it('should validate raw course data arrays using lintRawCourses', () => {
    const validRawCourses = [
      { id: 1, name: 'Materia 1', cursarReqId: [], aprobarReqId: [] },
      { id: 2, name: 'Materia 2', cursarReqId: [1], aprobarReqId: [] },
      { id: 3, name: 'Materia 3', cursarReqId: [2], aprobarReqId: [] }
    ];
    expect(service.lintRawCourses(validRawCourses).valid).toBe(true);

    const cyclicRawCourses = [
      { id: 1, name: 'Materia 1', cursarReqId: [3], aprobarReqId: [] },
      { id: 2, name: 'Materia 2', cursarReqId: [1], aprobarReqId: [] },
      { id: 3, name: 'Materia 3', cursarReqId: [2], aprobarReqId: [] }
    ];
    const cyclicRes = service.lintRawCourses(cyclicRawCourses);
    expect(cyclicRes.valid).toBe(false);
    expect(cyclicRes.errors.some(e => e.includes('circular'))).toBe(true);
  });
});
