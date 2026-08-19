import { TestBed } from '@angular/core/testing';
import { PlanSanitizerService } from '../plan-sanitizer.service';
import { UserProgressOverlay, PlanManifest } from '../../models/plan-manifest.model';

describe('Air-Gap Architectural Boundary Verification', () => {
  let sanitizer: PlanSanitizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(PlanSanitizerService);
  });

  it('MUST NOT allow UserProgressOverlay or personal notes to leak into exported PlanManifest payloads', () => {
    const sensitiveOverlay: UserProgressOverlay = {
      planId: 'urn:orgcursada:unsam:bio:v1',
      courseStatuses: { mat101: 'approved', phys101: 'coursing' },
      semesterOverrides: { phys101: 3 },
      selectedLessons: { mat101: ['L1'] },
      userNotes: { mat101: 'Nota privada super confidencial' }
    };

    const rawManifest: PlanManifest = {
      id: 'urn:orgcursada:unsam:bio:v1',
      name: 'Biotecnología',
      university: 'UNSAM',
      version: '1.0.0',
      courses: [
        { id: 'mat101', name: 'Matemática I', year: 1, q: 1, cursarReq: [], aprobarReq: [] }
      ]
    };

    // Combine raw manifest with private overlay to test sanitizer defense
    const dirtyCombinedObject = {
      ...rawManifest,
      overlay: sensitiveOverlay,
      user_notes: 'Nota filtrada',
      status: 'approved'
    };

    const sanitized = sanitizer.sanitizeForPublishing(dirtyCombinedObject);
    const jsonOut = JSON.stringify(sanitized);

    expect(jsonOut).not.toContain('approved');
    expect(jsonOut).not.toContain('coursing');
    expect(jsonOut).not.toContain('super confidencial');
    expect(jsonOut).not.toContain('overlay');
  });
});
