import { Injectable } from '@angular/core';
import { PlanManifest } from '../models/plan-manifest.model';

export interface LintResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PlanLinterService {
  /**
   * Performs graph AST linting on a PlanManifest.
   * 1. Detects circular prerequisite dependencies via Kahn's Algorithm (Topological Sort).
   * 2. Checks for dangling prerequisite references.
   * 3. Enforces realistic academic structural bounds.
   */
  public lintPlanManifest(manifest: PlanManifest): LintResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest || !Array.isArray(manifest.courses)) {
      return { valid: false, errors: ['Manifest no válido o sin lista de materias.'], warnings: [] };
    }

    // 1. Structural Sanity Bounds Check
    if (manifest.courses.length === 0) {
      errors.push('El plan no contiene ninguna materia.');
    }
    if (manifest.courses.length > 200) {
      errors.push(`El plan excede el límite máximo de materias (200). Encontradas: ${manifest.courses.length}`);
    }

    const maxYear = Math.max(...manifest.courses.map(c => c.year || 1), 0);
    if (maxYear > 15) {
      errors.push(`El plan excede el límite razonable de años/semestres (${maxYear} años).`);
    }

    // Map of course identifier (ID and Name) -> exists
    const knownIdentifiers = new Set<string>();
    manifest.courses.forEach(c => {
      if (c.id) knownIdentifiers.add(c.id);
      if (c.name) knownIdentifiers.add(c.name);
    });

    // 2. Dangling Prerequisite Reference Check
    manifest.courses.forEach(c => {
      const allReqs = [...(c.cursarReq || []), ...(c.aprobarReq || [])];
      allReqs.forEach(req => {
        if (!knownIdentifiers.has(req)) {
          errors.push(`Materia "${c.name}" posee una correlativa inexistente: "${req}".`);
        }
      });
    });

    // 3. Kahn's Algorithm for Topological Sort & DAG Cycle Detection
    const hasCycle = this.detectCyclesKahnsAlgorithm(manifest);
    if (hasCycle) {
      errors.push('Se detectó una dependencia circular de correlativas (Ciclo en el Grafo de Correlatividades).');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Implements Kahn's Algorithm for Topological Sorting to detect cycles in prerequisite DAG.
   */
  private detectCyclesKahnsAlgorithm(manifest: PlanManifest): boolean {
    const courses = manifest.courses;
    if (courses.length === 0) return false;

    // Map each course ID/Name to an index
    const nodeMap = new Map<string, number>();
    courses.forEach((c, idx) => {
      nodeMap.set(c.id, idx);
      nodeMap.set(c.name, idx);
    });

    const inDegree = new Array<number>(courses.length).fill(0);
    const adjList: number[][] = Array.from({ length: courses.length }, () => []);

    // Build directed adjacency graph: Prerequisite -> Target Course
    courses.forEach((c, targetIdx) => {
      const reqs = new Set([...(c.cursarReq || []), ...(c.aprobarReq || [])]);
      reqs.forEach(req => {
        const prereqIdx = nodeMap.get(req);
        if (prereqIdx !== undefined && prereqIdx !== targetIdx) {
          adjList[prereqIdx].push(targetIdx);
          inDegree[targetIdx]++;
        }
      });
    });

    // Queue nodes with 0 in-degree (no prerequisites)
    const queue: number[] = [];
    inDegree.forEach((deg, idx) => {
      if (deg === 0) queue.push(idx);
    });

    let visitedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      visitedCount++;

      for (const v of adjList[u]) {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      }
    }

    // If visited count != total courses, there is at least one cycle
    return visitedCount !== courses.length;
  }

  public isFuturePrerequisite(source: { year?: number; q?: number }, target: { year?: number; q?: number }): boolean {
    const sYear = source.year || 1;
    const tYear = target.year || 1;
    const sQ = source.q || 1;
    const tQ = target.q || 1;

    if (sYear > tYear) return true;
    if (sYear < tYear) return false;
    if (sQ === 2 && tQ === 1) return true;
    if (sQ === 3 && tQ === 1) return true;
    return false;
  }

  /**
   * Lints an array of RawCourseData (used in Career Builder and internal stores).
   */
  public lintRawCourses(courses: { id: number; name: string; year?: number; q?: number; cursarReqId?: number[]; aprobarReqId?: number[] }[]): LintResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(courses) || courses.length === 0) {
      return { valid: false, errors: ['No hay materias para validar.'], warnings: [] };
    }

    const courseMap = new Map<number, { id: number; name: string; year?: number; q?: number; cursarReqId?: number[]; aprobarReqId?: number[] }>();
    courses.forEach((c) => courseMap.set(c.id, c));

    courses.forEach((c) => {
      const cursarReqs = c.cursarReqId || [];
      const aprobarReqs = c.aprobarReqId || [];
      const allReqs = [...cursarReqs, ...aprobarReqs];

      // Self reference check
      if (allReqs.includes(c.id)) {
        errors.push(`La materia "${c.name}" no puede ser correlativa de sí misma.`);
      }

      // Dangling reference & future prerequisite check
      allReqs.forEach((reqId) => {
        const reqCourse = courseMap.get(reqId);
        if (!reqCourse) {
          errors.push(`La materia "${c.name}" posee una correlativa con ID inexistente (${reqId}).`);
        } else if (this.isFuturePrerequisite(reqCourse, c)) {
          errors.push(`La materia "${c.name}" no puede depender de "${reqCourse.name}" porque pertenece a un período posterior.`);
        }
      });
    });

    const hasCycle = this.detectCyclesInRawCourses(courses);
    if (hasCycle) {
      errors.push('Se detectó una dependencia circular de correlativas entre las materias.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private detectCyclesInRawCourses(courses: { id: number; cursarReqId?: number[]; aprobarReqId?: number[] }[]): boolean {
    if (courses.length === 0) return false;

    const nodeMap = new Map<number, number>();
    courses.forEach((c, idx) => {
      nodeMap.set(c.id, idx);
    });

    const inDegree = new Array<number>(courses.length).fill(0);
    const adjList: number[][] = Array.from({ length: courses.length }, () => []);

    courses.forEach((c, targetIdx) => {
      const reqs = new Set([...(c.cursarReqId || []), ...(c.aprobarReqId || [])]);
      reqs.forEach((reqId) => {
        const prereqIdx = nodeMap.get(reqId);
        if (prereqIdx !== undefined && prereqIdx !== targetIdx) {
          adjList[prereqIdx].push(targetIdx);
          inDegree[targetIdx]++;
        }
      });
    });

    const queue: number[] = [];
    inDegree.forEach((deg, idx) => {
      if (deg === 0) queue.push(idx);
    });

    let visitedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      visitedCount++;

      for (const v of adjList[u]) {
        inDegree[v]--;
        if (inDegree[v] === 0) {
          queue.push(v);
        }
      }
    }

    return visitedCount !== courses.length;
  }
}
