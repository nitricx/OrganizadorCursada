import { PlanManifest, RebaseConflict } from '../models/plan-manifest.model';

/**
 * Compares two PlanManifest objects and extracts list of structural rebase conflicts / diffs.
 */
export function comparePlanManifests(
  oldManifest: PlanManifest,
  newManifest: PlanManifest,
): RebaseConflict[] {
  const conflicts: RebaseConflict[] = [];

  const oldCoursesMap = new Map(oldManifest.courses.map((c) => [c.id, c]));
  const newCoursesMap = new Map(newManifest.courses.map((c) => [c.id, c]));

  oldCoursesMap.forEach((oldCourse, id) => {
    const newCourse = newCoursesMap.get(id);
    if (!newCourse) {
      conflicts.push({
        courseId: id,
        courseName: oldCourse.name,
        type: 'course_removed',
        description: `La asignatura "${oldCourse.name}" fue removida en el nuevo plan.`,
        oldValue: oldCourse.name,
      });
    } else {
      if (oldCourse.year !== newCourse.year || oldCourse.q !== newCourse.q) {
        conflicts.push({
          courseId: id,
          courseName: newCourse.name,
          type: 'semester_changed',
          description: `Cambio de cuatrimestre para "${newCourse.name}".`,
          oldValue: `Año ${oldCourse.year} Q${oldCourse.q}`,
          newValue: `Año ${newCourse.year} Q${newCourse.q}`,
        });
      }

      const oldCursar = (oldCourse.cursarReq || []).slice().sort().join(',');
      const newCursar = (newCourse.cursarReq || []).slice().sort().join(',');
      const oldAprobar = (oldCourse.aprobarReq || []).slice().sort().join(',');
      const newAprobar = (newCourse.aprobarReq || []).slice().sort().join(',');

      if (oldCursar !== newCursar || oldAprobar !== newAprobar) {
        conflicts.push({
          courseId: id,
          courseName: newCourse.name,
          type: 'prerequisite_modified',
          description: `Las correlativas de "${newCourse.name}" fueron modificadas.`,
          oldValue: { cursar: oldCourse.cursarReq, aprobar: oldCourse.aprobarReq },
          newValue: { cursar: newCourse.cursarReq, aprobar: newCourse.aprobarReq },
        });
      }
    }
  });

  return conflicts;
}
