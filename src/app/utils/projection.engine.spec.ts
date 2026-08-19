import { PlanManifest, UserProgressOverlay, CommissionPack } from '../models/plan-manifest.model';
import { projectViewState } from './projection.engine';
import { DayOfWeek } from '../models/course';

describe('projection.engine (Exhaustive Test Suite)', () => {
  const sampleManifest: PlanManifest = {
    id: 'urn:orgcursada:test:plan1',
    name: 'Ingeniería Test',
    university: 'UNSAM',
    version: '1.0.0',
    courses: [
      {
        id: 'math101',
        name: 'Matemática I',
        year: 1,
        q: 1,
        cursarReq: [],
        aprobarReq: []
      },
      {
        id: 'math102',
        name: 'Matemática II',
        year: 1,
        q: 2,
        cursarReq: ['math101'],
        aprobarReq: ['math101']
      },
      {
        id: 'phys101',
        name: 'Física I',
        year: 1,
        q: 2,
        cursarReq: ['math101'],
        aprobarReq: []
      }
    ]
  };

  const sampleOverlay: UserProgressOverlay = {
    planId: 'urn:orgcursada:test:plan1',
    courseStatuses: {
      math101: 'approved',
      math102: 'coursing'
    },
    semesterOverrides: {
      math102: 3
    },
    selectedLessons: {
      math101: ['L1']
    },
    userNotes: {
      math101: 'Nota privada'
    },
    customPrereqDeltas: {
      phys101: {
        addCursar: ['math102'],
        removeCursar: ['math101']
      }
    }
  };

  const samplePack1: CommissionPack = {
    id: 'pack1',
    planId: 'urn:orgcursada:test:plan1',
    term: '2024-Q1',
    professors: {
      math101: ['GOMEZ, A.']
    },
    lessons: {
      math101: [
        {
          id: 'L1',
          professor: 'GOMEZ, A.',
          day: DayOfWeek.Monday,
          startTime: '08:00',
          endTime: '12:00'
        }
      ]
    }
  };

  const samplePack2: CommissionPack = {
    id: 'pack2',
    planId: 'urn:orgcursada:test:plan1',
    term: '2024-Q1',
    professors: {
      math102: ['PEREZ, M.']
    },
    lessons: {
      math102: [
        {
          id: 'L2',
          professor: 'PEREZ, M.',
          day: DayOfWeek.Wednesday,
          startTime: '14:00',
          endTime: '18:00'
        }
      ]
    }
  };

  it('should project view state correctly from manifest, packs, and overlay', () => {
    const viewState = projectViewState(sampleManifest, [samplePack1, samplePack2], sampleOverlay);

    expect(viewState.length).toBe(3);
    expect(viewState[0].name).toBe('Matemática I');
    expect(viewState[0].status).toBe('approved');
    expect(viewState[0].lessons.length).toBe(1);
    expect(viewState[0].lessons[0].professor).toBe('GOMEZ, A.');
    expect(viewState[0].selectedLessonId).toBe('L1');

    expect(viewState[1].name).toBe('Matemática II');
    expect(viewState[1].status).toBe('coursing');
    expect(viewState[1].q).toBe(3); // Overridden semester
    expect(viewState[1].cursarReqId).toEqual([1]); // math101 is numeric ID 1
    expect(viewState[1].lessons.length).toBe(1);
    expect(viewState[1].lessons[0].professor).toBe('PEREZ, M.');
  });

  it('should apply custom prerequisite deltas (adding and removing prerequisites)', () => {
    const viewState = projectViewState(sampleManifest, [], sampleOverlay);
    const phys = viewState.find(c => c.name === 'Física I')!;

    // math101 (ID 1) was removed, math102 (ID 2) was added via customPrereqDeltas
    expect(phys.cursarReqId).toEqual([2]);
  });

  it('should default missing overlay fields gracefully to pending status', () => {
    const viewState = projectViewState(sampleManifest, [], null);
    expect(viewState.length).toBe(3);
    expect(viewState[0].status).toBe('pending');
    expect(viewState[1].status).toBe('pending');
    expect(viewState[2].status).toBe('pending');
    expect(viewState[1].q).toBe(2); // Original quarter
  });

  it('should enforce Object.freeze on the PlanManifest object and its courses array', () => {
    const freshManifest: PlanManifest = {
      id: 'urn:orgcursada:test:freeze',
      name: 'Test Freeze',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'c1', name: 'Course 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] }
      ]
    };

    expect(Object.isFrozen(freshManifest)).toBe(false);
    expect(Object.isFrozen(freshManifest.courses)).toBe(false);

    projectViewState(freshManifest, [], null);

    expect(Object.isFrozen(freshManifest)).toBe(true);
    expect(Object.isFrozen(freshManifest.courses)).toBe(true);
  });
});
