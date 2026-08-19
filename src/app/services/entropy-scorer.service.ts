import { Injectable } from '@angular/core';
import { PlanManifest } from '../models/plan-manifest.model';

export interface EntropyReport {
  score: number; // 0 (Low uniqueness/High privacy) to 100 (Extremely unique/High privacy risk)
  riskLevel: 'low' | 'medium' | 'high';
  uniqueElectivesCount: number;
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EntropyScorerService {
  /**
   * Calculates the entropy (uniqueness index) of a PlanManifest graph.
   * Higher score indicates a rare combination of electives or cross-campus subjects
   * that could reveal a small student cohort (< 5 individuals).
   */
  public calculatePlanEntropy(manifest: PlanManifest): EntropyReport {
    const warnings: string[] = [];
    let score = 0;

    if (!manifest || !manifest.courses) {
      return { score: 0, riskLevel: 'low', uniqueElectivesCount: 0, warnings: [] };
    }

    // Check total subject count vs standard degree norms
    const totalCourses = manifest.courses.length;
    const electiveKeywords = ['electiva', 'optativa', 'seminario', 'taller especial'];

    const electives = manifest.courses.filter(c => 
      electiveKeywords.some(kw => c.name.toLowerCase().includes(kw))
    );

    const uniqueElectivesCount = electives.length;

    if (uniqueElectivesCount > 3) {
      score += 35;
      warnings.push(`Combinación de ${uniqueElectivesCount} materias optativas detectada. Puede identificar a un grupo muy reducido de estudiantes.`);
    } else if (uniqueElectivesCount > 1) {
      score += 15;
    }

    // Check for non-standard multi-campus naming signals in subject titles
    const multiCampusCourses = manifest.courses.filter(c => 
      c.name.toLowerCase().includes('sede') || c.name.toLowerCase().includes('facultad')
    );

    if (multiCampusCourses.length > 0) {
      score += 40;
      warnings.push(`Materias con asignación de sede específica detectadas (${multiCampusCourses.length}). Se recomienda desglosarlas como packs independientes.`);
    }

    // Check if total courses deviate significantly from average degree size (approx 30-45 courses)
    if (totalCourses > 55) {
      score += 20;
      warnings.push(`El plan contiene un número inusualmente elevado de materias (${totalCourses}).`);
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (score >= 50) {
      riskLevel = 'high';
    } else if (score >= 25) {
      riskLevel = 'medium';
    }

    return {
      score,
      riskLevel,
      uniqueElectivesCount,
      warnings
    };
  }
}
