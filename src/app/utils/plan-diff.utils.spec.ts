import { comparePlanManifests } from './plan-diff.utils';
import { PlanManifest } from '../models/plan-manifest.model';

const OLD_MANIFEST: PlanManifest = {
  id: 'plan-v1',
  name: 'Plan v1',
  university: 'UNLP',
  version: '1.0.0',
  courses: [
    { id: 'c1', name: 'Matemática 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
    { id: 'c2', name: 'Física 1', year: 1, q: 2, cursarReq: ['c1'], aprobarReq: ['c1'] },
    { id: 'c3', name: 'Química 1', year: 1, q: 2, cursarReq: [], aprobarReq: [] },
  ],
};

const NEW_MANIFEST: PlanManifest = {
  id: 'plan-v2',
  name: 'Plan v2',
  university: 'UNLP',
  version: '2.0.0',
  courses: [
    { id: 'c1', name: 'Matemática 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
    { id: 'c2', name: 'Física 1', year: 2, q: 1, cursarReq: ['c1', 'c3'], aprobarReq: ['c1'] },
  ],
};

describe('plan-diff.utils', () => {
  it('should detect removed courses, semester changes, and prerequisite modifications', () => {
    const conflicts = comparePlanManifests(OLD_MANIFEST, NEW_MANIFEST);

    expect(conflicts).toHaveLength(3);

    const removed = conflicts.find((c) => c.type === 'course_removed');
    expect(removed).toBeDefined();
    expect(removed?.courseId).toBe('c3');

    const semesterChanged = conflicts.find((c) => c.type === 'semester_changed');
    expect(semesterChanged).toBeDefined();
    expect(semesterChanged?.courseId).toBe('c2');

    const prereqMod = conflicts.find((c) => c.type === 'prerequisite_modified');
    expect(prereqMod).toBeDefined();
    expect(prereqMod?.courseId).toBe('c2');
  });
});
