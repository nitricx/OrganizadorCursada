import { Injectable } from '@angular/core';

export interface AntiSybilProof {
  proofType: 'turnstile' | 'pow';
  token?: string;
  powNonce?: number;
  challenge?: string;
  payloadHash: string;
  timestamp: number;
}

export interface AntiSybilVerificationPayload {
  proof: AntiSybilProof;
  payload: string;
}

@Injectable({
  providedIn: 'root'
})
export class AntiSybilService {
  /**
   * Calculates a SHA-256 hex string for a given text input using Web Crypto API.
   */
  public async sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates anti-sybil proof required for publishing plans or submitting votes.
   * Uses Cloudflare Turnstile API when available, or executes a client-side Hashcash Proof-of-Work puzzle (SHA256).
   */
  public async generateAntiSybilProof(payloadString: string): Promise<AntiSybilProof> {
    const timestamp = Date.now();
    const payloadHash = await this.sha256(payloadString);

    // 1. Check if Cloudflare Turnstile widget exists on window via official getResponse API
    const turnstileObj = (window as any).turnstile;
    if (turnstileObj && typeof turnstileObj.getResponse === 'function') {
      const turnstileToken = turnstileObj.getResponse();
      if (turnstileToken && typeof turnstileToken === 'string' && turnstileToken.trim().length > 0) {
        return {
          proofType: 'turnstile',
          token: turnstileToken,
          payloadHash,
          timestamp
        };
      }
    }

    // Fallback: WASM/JS Proof-of-Work with time-bucketed salted challenge
    // Challenge is tied to payloadHash and a 5-minute epoch timestamp bucket
    const epochBucket = Math.floor(timestamp / 300000);
    const challenge = await this.sha256(`${payloadHash}:${epochBucket}`);
    const targetPrefix = '000';
    let nonce = 0;

    while (nonce < 500000) {
      const candidateHash = await this.sha256(`${challenge}:${payloadHash}:${nonce}`);
      if (candidateHash.startsWith(targetPrefix)) {
        return {
          proofType: 'pow',
          powNonce: nonce,
          challenge,
          payloadHash,
          timestamp
        };
      }
      nonce++;
    }

    throw new Error('PoW puzzle timeout. No se pudo verificar la prueba anti-bot.');
  }

  /**
   * Verifies proof consistency locally before transmitting to server/API Gateway.
   */
  public async verifyProofLocally(proof: AntiSybilProof, payloadString: string): Promise<boolean> {
    if (!proof || !payloadString) return false;

    // Check payload hash match
    const computedPayloadHash = await this.sha256(payloadString);
    if (proof.payloadHash !== computedPayloadHash) return false;

    // Check timestamp freshness (must be within last 10 minutes)
    const now = Date.now();
    if (Math.abs(now - proof.timestamp) > 600000) return false;

    if (proof.proofType === 'turnstile') {
      return typeof proof.token === 'string' && proof.token.trim().length > 0;
    }

    if (proof.proofType === 'pow') {
      if (typeof proof.powNonce !== 'number' || !proof.challenge) return false;
      const candidateHash = await this.sha256(`${proof.challenge}:${proof.payloadHash}:${proof.powNonce}`);
      return candidateHash.startsWith('000');
    }

    return false;
  }

  /**
   * Bundles proof and payload into structured verification request object for backend submission.
   */
  public buildVerificationPayload(proof: AntiSybilProof, payload: string): AntiSybilVerificationPayload {
    return { proof, payload };
  }
}

