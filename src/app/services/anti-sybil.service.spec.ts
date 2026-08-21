import { TestBed } from '@angular/core/testing';
import { AntiSybilService, AntiSybilProof } from './anti-sybil.service';

describe('AntiSybilService', () => {
  let service: AntiSybilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AntiSybilService);
    delete (window as any).turnstile;
    delete (window as any).turnstileToken;
  });

  afterEach(() => {
    delete (window as any).turnstile;
    delete (window as any).turnstileToken;
  });

  it('should detect turnstile token via window.turnstile.getResponse() if available', async () => {
    (window as any).turnstile = {
      getResponse: () => 'mock_turnstile_token'
    };
    const proof = await service.generateAntiSybilProof('test_payload');
    expect(proof.proofType).toBe('turnstile');
    expect(proof.token).toBe('mock_turnstile_token');
    expect(proof.payloadHash).toBeTruthy();
    expect(proof.timestamp).toBeGreaterThan(0);
  });

  it('should execute WASM/JS Proof-of-Work with salted challenge when turnstile is absent', async () => {
    const proof = await service.generateAntiSybilProof('test_payload_pow');
    expect(proof.proofType).toBe('pow');
    expect(typeof proof.powNonce).toBe('number');
    expect(proof.powNonce).toBeGreaterThanOrEqual(0);
    expect(proof.challenge).toBeTruthy();
    expect(proof.payloadHash).toBeTruthy();
    expect(proof.timestamp).toBeGreaterThan(0);
  });

  it('should verify valid PoW proof locally', async () => {
    const payload = 'valid_test_payload';
    const proof = await service.generateAntiSybilProof(payload);
    const isValid = await service.verifyProofLocally(proof, payload);
    expect(isValid).toBe(true);
  });

  it('should reject proof if payload string does not match payloadHash', async () => {
    const proof = await service.generateAntiSybilProof('original_payload');
    const isValid = await service.verifyProofLocally(proof, 'tampered_payload');
    expect(isValid).toBe(false);
  });

  it('should reject proof with expired timestamp (> 10 minutes old)', async () => {
    const payload = 'expired_payload';
    const proof = await service.generateAntiSybilProof(payload);
    proof.timestamp = Date.now() - 700000; // 11.6 minutes ago
    const isValid = await service.verifyProofLocally(proof, payload);
    expect(isValid).toBe(false);
  });

  it('should reject PoW proof with invalid nonce', async () => {
    const payload = 'nonce_payload';
    const proof = await service.generateAntiSybilProof(payload);
    if (proof.proofType === 'pow') {
      proof.powNonce = 99999999;
    }
    const isValid = await service.verifyProofLocally(proof, payload);
    expect(isValid).toBe(false);
  });

  it('should build structured verification payload', async () => {
    const payload = 'payload_to_package';
    const proof = await service.generateAntiSybilProof(payload);
    const verificationPayload = service.buildVerificationPayload(proof, payload);

    expect(verificationPayload.proof).toBe(proof);
    expect(verificationPayload.payload).toBe(payload);
  });
});

