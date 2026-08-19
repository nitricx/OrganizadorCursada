import { TestBed } from '@angular/core/testing';
import { AntiSybilService } from './anti-sybil.service';

describe('AntiSybilService', () => {
  let service: AntiSybilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AntiSybilService);
  });

  it('should detect turnstile token on window if available', async () => {
    (window as any).turnstileToken = 'mock_turnstile_token';
    const proof = await service.generateAntiSybilProof('test_payload');
    expect(proof.proofType).toBe('turnstile');
    expect(proof.token).toBe('mock_turnstile_token');
    delete (window as any).turnstileToken;
  });

  it('should execute WASM/JS Proof-of-Work Hashcash puzzle when turnstile is absent', async () => {
    delete (window as any).turnstileToken;
    const proof = await service.generateAntiSybilProof('test_payload_pow');
    expect(proof.proofType).toBe('pow');
    expect(typeof proof.powNonce).toBe('number');
    expect(proof.powNonce).toBeGreaterThanOrEqual(0);
  });
});
