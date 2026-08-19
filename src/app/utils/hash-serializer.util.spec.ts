import { PlanManifest } from '../models/plan-manifest.model';
import { encodePlanToUrlHash, decodePlanFromUrlHash } from './hash-serializer.util';

describe('hash-serializer.util', () => {
  const sampleManifest: PlanManifest = {
    id: 'urn:orgcursada:unrn:audio:v1',
    name: 'Diseño Audiovisual',
    university: 'UNRN',
    version: '1.0.0',
    courses: [
      { id: 'c1', name: 'Producción Audiovisual 1', year: 1, q: 1, cursarReq: [], aprobarReq: [] }
    ]
  };

  it('should encode and decode PlanManifest cleanly through base64 URL hash', () => {
    const encoded = encodePlanToUrlHash(sampleManifest);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodePlanFromUrlHash(encoded);
    expect(decoded.name).toBe('Diseño Audiovisual');
    expect(decoded.courses.length).toBe(1);
    expect(decoded.courses[0].name).toBe('Producción Audiovisual 1');
  });
});
