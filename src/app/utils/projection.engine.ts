import { Course, CourseStatus, Lesson } from '../models/course';
import { CommissionPack, PlanManifest, UserProgressOverlay } from '../models/plan-manifest.model';

/**
 * Pure Functional Projection Engine.
 * 
 * Computes renderable UI state from an immutable PlanManifest asset,
 * zero or more CommissionPack addons, and a private UserProgressOverlay.
 * 
 * Enforces Object.freeze() on the manifest in memory to guarantee air-gapped immutability.
 */
export function projectViewState(
  manifest: PlanManifest,
  packs: CommissionPack[] = [],
  overlay?: UserProgressOverlay | null
): Course[] {
  // Guarantee immutability of public asset
  if (!Object.isFrozen(manifest)) {
    Object.freeze(manifest);
    Object.freeze(manifest.courses);
  }

  const courseStatuses = overlay?.courseStatuses || {};
  const semesterOverrides = overlay?.semesterOverrides || {};
  const selectedLessonsMap = overlay?.selectedLessons || {};
  const customPrereqDeltas = overlay?.customPrereqDeltas || {};

  // Build ID to numeric index map for legacy compatibility if numeric IDs are needed
  const idToNumericMap = new Map<string, number>();
  manifest.courses.forEach((c, index) => {
    idToNumericMap.set(c.id, index + 1);
    // Also map course name to numeric ID for name-based prerequisite matching
    idToNumericMap.set(c.name, index + 1);
  });

  // Map each course manifest to renderable UI Course object
  return manifest.courses.map((cm, idx) => {
    const courseNumericId = idToNumericMap.get(cm.id) || idx + 1;
    const status: CourseStatus = courseStatuses[cm.id] || courseStatuses[cm.name] || 'pending';
    const overriddenSemester = semesterOverrides[cm.id] ?? semesterOverrides[cm.name];

    // Compute effective prerequisites (merging base requirements with custom user deltas)
    const userDelta = customPrereqDeltas[cm.id] || customPrereqDeltas[cm.name];
    let cursarReqStrings = [...cm.cursarReq];
    let aprobarReqStrings = [...cm.aprobarReq];

    if (userDelta) {
      if (userDelta.removeCursar) {
        cursarReqStrings = cursarReqStrings.filter(r => !userDelta.removeCursar?.includes(r));
      }
      if (userDelta.addCursar) {
        cursarReqStrings = [...cursarReqStrings, ...userDelta.addCursar];
      }
      if (userDelta.removeAprobar) {
        aprobarReqStrings = aprobarReqStrings.filter(r => !userDelta.removeAprobar?.includes(r));
      }
      if (userDelta.addAprobar) {
        aprobarReqStrings = [...aprobarReqStrings, ...userDelta.addAprobar];
      }
    }

    // Convert prerequisite course strings/IDs to numeric IDs for legacy component compatibility
    const cursarReqId = cursarReqStrings
      .map(req => idToNumericMap.get(req))
      .filter((val): val is number => val !== undefined);

    const aprobarReqId = aprobarReqStrings
      .map(req => idToNumericMap.get(req))
      .filter((val): val is number => val !== undefined);

    // Assemble commission lessons from subscribed packs
    const assembledLessons: Lesson[] = [];
    packs.forEach(pack => {
      const packLessons = pack.lessons[cm.id] || pack.lessons[cm.name];
      if (packLessons) {
        packLessons.forEach(l => {
          assembledLessons.push({
            id: l.id,
            professor: l.professor,
            day: l.day,
            startTime: l.startTime,
            endTime: l.endTime,
            status: status
          });
        });
      }
    });

    const selectedLessons = selectedLessonsMap[cm.id] || selectedLessonsMap[cm.name];
    const selectedLessonId = selectedLessons && selectedLessons.length > 0 ? selectedLessons[0] : null;

    return {
      id: courseNumericId,
      name: cm.name,
      year: cm.year,
      q: overriddenSemester !== undefined ? overriddenSemester : cm.q,
      status: status,
      cursarReqId: cursarReqId,
      aprobarReqId: aprobarReqId,
      lessons: assembledLessons,
      selectedLessonId: selectedLessonId
    };
  });
}
