import { PlanManifest, UserProgressOverlay, RebaseConflict } from '../models/plan-manifest.model';

export interface RebaseResult {
  updatedOverlay: UserProgressOverlay;
  conflicts: RebaseConflict[];
}

/**
 * Non-Destructive Delta Rebase Engine.
 * 
 * Re-applies a user's private progress overlay on top of an updated upstream PlanManifest (v1 -> v2)
 * without overwriting completed course states or corrupting custom user semester placements.
 */
export function rebaseUserOverlay(
  oldManifest: PlanManifest,
  newManifest: PlanManifest,
  currentOverlay: UserProgressOverlay
): RebaseResult {
  const conflicts: RebaseConflict[] = [];

  // Build maps of old vs new manifest courses by canonical ID / Name
  const oldCourseMap = new Map(oldManifest.courses.map(c => [c.id, c]));
  const newCourseMap = new Map(newManifest.courses.map(c => [c.id, c]));

  // Also map by name for fallback matching
  oldManifest.courses.forEach(c => oldCourseMap.set(c.name, c));
  newManifest.courses.forEach(c => newCourseMap.set(c.name, c));

  const newStatuses: Record<string, any> = {};
  const newSemesterOverrides: Record<string, number> = {};
  const newSelectedLessons: Record<string, string[]> = {};
  const newNotes: Record<string, string> = {};

  // Step 1 & 2: Progress Preservation across manifest swap
  // Copy over existing user state for courses present in new manifest
  Object.keys(currentOverlay.courseStatuses).forEach(courseKey => {
    const status = currentOverlay.courseStatuses[courseKey];
    if (newCourseMap.has(courseKey)) {
      newStatuses[courseKey] = status;
    } else {
      // Course removed upstream, flag as conflict if completed
      if (status !== 'pending') {
        conflicts.push({
          courseId: courseKey,
          courseName: courseKey,
          type: 'course_removed',
          description: `La materia "${courseKey}" fue eliminada en la versión ${newManifest.version} del plan, pero se conserva en su historial.`
        });
        // Retain status in overlay to preserve student history
        newStatuses[courseKey] = status;
      }
    }
  });

  // Preserve semester placement overrides
  Object.keys(currentOverlay.semesterOverrides).forEach(courseKey => {
    const semIndex = currentOverlay.semesterOverrides[courseKey];
    const newCourse = newCourseMap.get(courseKey);
    if (newCourse) {
      newSemesterOverrides[courseKey] = semIndex;
      if (newCourse.q !== semIndex) {
        // Confirm user override is retained
      }
    }
  });

  // Step 3: Check for prerequisite modifications in updated manifest
  newManifest.courses.forEach(newC => {
    const oldC = oldCourseMap.get(newC.id) || oldCourseMap.get(newC.name);
    if (oldC) {
      const oldCursar = (oldC.cursarReq || []).sort().join(',');
      const newCursar = (newC.cursarReq || []).sort().join(',');
      const oldAprobar = (oldC.aprobarReq || []).sort().join(',');
      const newAprobar = (newC.aprobarReq || []).sort().join(',');

      if (oldCursar !== newCursar || oldAprobar !== newAprobar) {
        conflicts.push({
          courseId: newC.id,
          courseName: newC.name,
          type: 'prerequisite_modified',
          description: `Las correlativas de "${newC.name}" fueron actualizadas en la versión ${newManifest.version}.`,
          oldValue: { cursarReq: oldC.cursarReq, aprobarReq: oldC.aprobarReq },
          newValue: { cursarReq: newC.cursarReq, aprobarReq: newC.aprobarReq }
        });
      }
    }
  });

  // Preserve lessons and notes
  Object.assign(newSelectedLessons, currentOverlay.selectedLessons);
  Object.assign(newNotes, currentOverlay.userNotes);

  const updatedOverlay: UserProgressOverlay = {
    planId: newManifest.id,
    courseStatuses: newStatuses,
    semesterOverrides: newSemesterOverrides,
    selectedLessons: newSelectedLessons,
    userNotes: newNotes,
    customPrereqDeltas: currentOverlay.customPrereqDeltas
  };

  return {
    updatedOverlay,
    conflicts
  };
}
