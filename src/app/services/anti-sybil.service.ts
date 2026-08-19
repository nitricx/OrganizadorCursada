import { Injectable } from '@angular/core';

export interface AntiSybilProof {
  proofType: 'turnstile' | 'pow';
  token?: string;
  powNonce?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AntiSybilService {
  /**
   * Generates anti-sybil proof required for publishing plans or submitting votes.
   * Uses Cloudflare Turnstile when available, or executes a client-side Hashcash Proof-of-Work puzzle (SHA256).
   */
  public async generateAntiSybilProof(payloadString: string): Promise<AntiSybilProof> {
    // Check if Cloudflare Turnstile widget exists on window
    const turnstileToken = (window as any).turnstileToken;
    if (turnstileToken) {
      return {
        proofType: 'turnstile',
        token: turnstileToken,
        timestamp: Date.now()
      };
    }

    // Fallback: WASM/JS Proof-of-Work (Hashcash puzzle)
    // Find nonce such that SHA256(payloadString + nonce) starts with '000' (Target difficulty)
    const targetPrefix = '000';
    let nonce = 0;
    const encoder = new TextEncoder();

    while (nonce < 500000) {
      const data = encoder.encode(payloadString + nonce);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.startsWith(targetPrefix)) {
        return {
          proofType: 'pow',
          powNonce: nonce,
          timestamp: Date.now()
        };
      }
      nonce++;
    }

    throw new Error('PoW puzzle timeout. No se pudo verificar la prueba anti-bot.');
  }
}
