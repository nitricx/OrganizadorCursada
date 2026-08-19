import { TestBed } from '@angular/core/testing';
import { PlanImportExportService } from './plan-import-export.service';
import { PlanManifest, UserProgressOverlay } from '../models/plan-manifest.model';

describe('PlanImportExportService', () => {
  let service: PlanImportExportService;

  const sampleManifest: PlanManifest = {
    id: 'p1',
    name: 'Diseño Audiovisual',
    university: 'UNRN',
    version: '1.0.0',
    courses: [
      { id: 'c1', name: 'Química 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] }
    ]
  };

  const sampleOverlay: UserProgressOverlay = {
    planId: 'p1',
    courseStatuses: { c1: 'approved' },
    semesterOverrides: {},
    selectedLessons: {},
    userNotes: {}
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanImportExportService);
  });

  it('should export personal user state with format marker and warning header', () => {
    const jsonStr = service.exportPersonalUserState(sampleOverlay, sampleManifest);
    expect(jsonStr).toContain('ORG_CURSADA_PRIVATE_USER_STATE_V1');
    expect(jsonStr).toContain('Private Personal Progress — DO NOT upload to public spaces.');
  });

  it('should reject private user state in Workshop upload context', () => {
    const jsonStr = service.exportPersonalUserState(sampleOverlay, sampleManifest);
    expect(() => {
      service.importPackage(jsonStr, true); // true = Workshop upload context
    }).toThrowError(/RECHAZADO/);
  });
});
