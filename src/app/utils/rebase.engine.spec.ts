import { PlanManifest, UserProgressOverlay } from '../models/plan-manifest.model';
import { rebaseUserOverlay } from './rebase.engine';

describe('rebase.engine (Exhaustive Test Suite)', () => {
  const v1Manifest: PlanManifest = {
    id: 'plan1',
    name: 'Ingeniería v1',
    university: 'UNSAM',
    version: '1.0.0',
    courses: [
      { id: 'math101', name: 'Matemática I', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
      { id: 'math102', name: 'Matemática II', year: 1, q: 2, cursarReq: ['math101'], aprobarReq: ['math101'] },
      { id: 'old_course', name: 'Materia Obsoleta', year: 2, q: 1, cursarReq: [], aprobarReq: [] }
    ]
  };

  const v2Manifest: PlanManifest = {
    id: 'plan1',
    name: 'Ingeniería v2',
    university: 'UNSAM',
    version: '1.1.0',
    courses: [
      { id: 'math101', name: 'Matemática I', year: 1, q: 1, cursarReq: [], aprobarReq: [] },
      { id: 'math102', name: 'Matemática II', year: 1, q: 2, cursarReq: ['math101'], aprobarReq: [] }, // Prereq modified
      { id: 'physics101', name: 'Física I', year: 1, q: 2, cursarReq: ['math101'], aprobarReq: [] } // New course added
      // old_course removed upstream
    ]
  };

  const userOverlay: UserProgressOverlay = {
    planId: 'plan1',
    courseStatuses: {
      math101: 'approved',
      math102: 'coursing',
      old_course: 'approved'
    },
    semesterOverrides: {
      math102: 4
    },
    selectedLessons: {
      math101: ['L1']
    },
    userNotes: {
      math101: 'Personal note'
    }
  };

  it('should preserve completed course statuses during manifest swap', () => {
    const res = rebaseUserOverlay(v1Manifest, v2Manifest, userOverlay);
    expect(res.updatedOverlay.courseStatuses['math101']).toBe('approved');
    expect(res.updatedOverlay.courseStatuses['math102']).toBe('coursing');
    expect(res.updatedOverlay.courseStatuses['physics101']).toBeUndefined(); // Defaults to pending
  });

  it('should retain removed completed courses in overlay to preserve student history and flag conflict', () => {
    const res = rebaseUserOverlay(v1Manifest, v2Manifest, userOverlay);
    expect(res.updatedOverlay.courseStatuses['old_course']).toBe('approved');
    expect(res.conflicts.some(c => c.type === 'course_removed' && c.courseId === 'old_course')).toBe(true);
  });

  it('should preserve semester overrides, selected lessons, and personal notes across rebase', () => {
    const res = rebaseUserOverlay(v1Manifest, v2Manifest, userOverlay);
    expect(res.updatedOverlay.semesterOverrides['math102']).toBe(4);
    expect(res.updatedOverlay.selectedLessons['math101']).toEqual(['L1']);
    expect(res.updatedOverlay.userNotes['math101']).toBe('Personal note');
  });

  it('should identify prerequisite structural conflicts without corrupting user state', () => {
    const res = rebaseUserOverlay(v1Manifest, v2Manifest, userOverlay);
    const prereqConflict = res.conflicts.find(c => c.type === 'prerequisite_modified');
    expect(prereqConflict).toBeDefined();
    expect(prereqConflict!.courseId).toBe('math102');
  });
});
