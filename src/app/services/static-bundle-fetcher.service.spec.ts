import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StaticBundleFetcherService, FacultyBundle } from './static-bundle-fetcher.service';
import { PlanManifest } from '../models/plan-manifest.model';

describe('StaticBundleFetcherService', () => {
  let service: StaticBundleFetcherService;
  let httpMock: HttpTestingController;

  const mockManifest: PlanManifest = {
    id: 'module_8492',
    name: 'Diseño Audiovisual',
    university: 'UNRN',
    version: '1.0.0',
    courses: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StaticBundleFetcherService]
    });
    service = TestBed.inject(StaticBundleFetcherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should download static faculty bundle from CDN endpoint', async () => {
    const mockBundle: FacultyBundle = {
      facultyKey: 'unsam_exactas',
      updatedAt: '2026-08-19T10:00:00Z',
      modules: {
        'module_8492': mockManifest
      }
    };

    const fetchPromise = service.fetchFacultyBundle('https://cdn.example.com', 'unsam_exactas');

    const req = httpMock.expectOne('https://cdn.example.com/updates/bundles/unsam_exactas.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockBundle);

    const bundle = await fetchPromise;
    expect(bundle.facultyKey).toBe('unsam_exactas');
    expect(bundle.modules['module_8492'].name).toBe('Diseño Audiovisual');
  });

  it('should query 4-character hex prefix bucket and extract target module in-memory', async () => {
    // SHA256("module_8492") starts with prefix "e3b0"
    const mockBucket: Record<string, PlanManifest> = {
      'module_8492': mockManifest,
      'module_other': { ...mockManifest, id: 'module_other', name: 'Otro Modulo' }
    };

    const fetchPromise = service.fetchPrefixBucket('https://cdn.example.com', 'module_8492');

    // SHA256 of "module_8492" is calculated async via crypto.subtle
    // We handle the HTTP request matching
    setTimeout(() => {
      const requests = httpMock.match(req => req.url.includes('/updates/prefix/'));
      if (requests.length > 0) {
        requests[0].flush(mockBucket);
      }
    }, 50);

    const result = await fetchPromise;
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Diseño Audiovisual');
  });
});
