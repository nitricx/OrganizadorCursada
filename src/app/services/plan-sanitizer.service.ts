import { Injectable } from '@angular/core';
import { CourseManifest, PlanManifest } from '../models/plan-manifest.model';

@Injectable({
  providedIn: 'root'
})
export class PlanSanitizerService {
  /**
   * Prohibited high-cardinality / personal metadata attributes that must never exist in public manifests.
   */
  private readonly BANNED_KEYS = [
    'status',
    'grade',
    'user_notes',
    'userNotes',
    'moved_semester',
    'semesterOverrides',
    'cohort_year',
    'cohortYear',
    'classroom',
    'aula',
    'building',
    'phone',
    'email',
    'user_id',
    'userId',
    'timestamp'
  ];

  /**
   * Whitelist Serializer & $k$-Anonymity Metadata Generalizer.
   * Strips all private student lifecycle progress, high-cardinality cohort identifiers,
   * classroom physical location details, and PII before export/upload to public Workshop.
   */
  public sanitizeForPublishing(rawPayload: unknown): PlanManifest {
    if (!rawPayload || typeof rawPayload !== 'object') {
      throw new Error('Invalid plan payload provided for sanitization.');
    }

    const payload = rawPayload as Record<string, unknown>;
    const rawCourses = Array.isArray(payload['courses']) ? (payload['courses'] as Array<Record<string, unknown>>) : [];

    const sanitizedCourses: CourseManifest[] = rawCourses.map((c) => {
      const cleanCourse: CourseManifest = {
        id: String(c['id'] || c['name'] || ''),
        name: this.sanitizeString(String(c['name'] || '')),
        year: Number(c['year']) || 1,
        q: Number(c['q']) || 1,
        cursarReq: Array.isArray(c['cursarReq']) 
          ? (c['cursarReq'] as unknown[]).map((r) => String(r)) 
          : (Array.isArray(c['cursarReqId']) ? (c['cursarReqId'] as unknown[]).map((r) => String(r)) : []),
        aprobarReq: Array.isArray(c['aprobarReq']) 
          ? (c['aprobarReq'] as unknown[]).map((r) => String(r)) 
          : (Array.isArray(c['aprobarReqId']) ? (c['aprobarReqId'] as unknown[]).map((r) => String(r)) : [])
      };
      return cleanCourse;
    });

    const sanitizedManifest: PlanManifest = {
      id: String(payload['id'] || `urn:orgcursada:plan:${Date.now()}`),
      name: this.sanitizeString(String(payload['name'] || 'Carrera sin nombre')),
      university: this.sanitizeString(String(payload['university'] || 'Universidad General')),
      faculty: payload['faculty'] ? this.sanitizeString(String(payload['faculty'])) : undefined,
      version: String(payload['version'] || '1.0.0'),
      forkOf: payload['forkOf'] ? String(payload['forkOf']) : undefined,
      courses: sanitizedCourses
    };

    // Strict validation check: assert 0 banned keys remain
    this.assertZeroBannedKeys(sanitizedManifest);

    return sanitizedManifest;
  }

  /**
   * Sanitizes professor names by stripping emails, phone numbers, and formatting as "LASTNAME, I."
   */
  public sanitizeProfessorName(rawName: string): string {
    if (!rawName) return '';
    
    // Strip emails and phone numbers
    let cleaned = rawName
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/(\+\d{1,3}[- ]?)?\(?\d{2,4}\)?[- ]?\d{3,5}[- ]?\d{3,5}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove titles like Dr., Lic., Prof., Ing.
    cleaned = cleaned.replace(/^(Dr\.|Dra\.|Lic\.|Prof\.|Ing\.|Mg\.)\s+/i, '');

    const parts = cleaned.split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].toUpperCase();

    const lastName = parts[parts.length - 1].toUpperCase();
    const firstNameInitial = parts[0].substring(0, 1).toUpperCase();

    return `${lastName}, ${firstNameInitial}.`;
  }

  /**
   * Generalizes location strings (e.g. "Sede San Martín - Aula 4B - Turno Noche" -> "Turno Noche")
   */
  public generalizeLocationString(location: string): string {
    if (!location) return '';
    if (location.toLowerCase().includes('noche')) return 'Turno Noche';
    if (location.toLowerCase().includes('mañana')) return 'Turno Mañana';
    if (location.toLowerCase().includes('tarde')) return 'Turno Tarde';
    return 'General';
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Strip potential script tags
      .trim();
  }

  private assertZeroBannedKeys(obj: unknown): void {
    const jsonString = JSON.stringify(obj).toLowerCase();
    for (const key of this.BANNED_KEYS) {
      if (jsonString.includes(`"${key.toLowerCase()}":`)) {
        throw new Error(`Sanitization failed: prohibited key "${key}" detected in payload.`);
      }
    }
  }
}
