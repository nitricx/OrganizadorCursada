import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VotingNullifierService {
  private readonly DEVICE_SALT_KEY = 'orgcursada_device_salt_v1';
  private readonly FIRST_SEEN_KEY = 'orgcursada_first_seen_timestamp';

  constructor() {
    this.ensureDeviceIdentity();
  }

  /**
   * Generates a zero-knowledge action nullifier for voting or reporting without user accounts.
   * HMAC_SHA256(DeviceSalt, PlanID || Epoch || ActionType)
   */
  public async generateActionNullifier(
    planId: string,
    actionType: 'upvote' | 'downvote' | 'report',
    epoch: string = '2026-Q3'
  ): Promise<{ nullifier: string; retentionWeight: number }> {
    const salt = this.getDeviceSalt();
    const payload = `${planId}:${epoch}:${actionType}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(salt);
    const msgData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const nullifierHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const retentionWeight = this.calculateRetentionWeight();

    return {
      nullifier: nullifierHex,
      retentionWeight
    };
  }

  /**
   * Calculates retention-weighted voting power:
   * 1.0x baseline for fresh installs, 5.0x weight for installs active > 7 days.
   */
  private calculateRetentionWeight(): number {
    const firstSeenStr = this.getItem(this.FIRST_SEEN_KEY);
    if (!firstSeenStr) return 1.0;

    const firstSeenMs = parseInt(firstSeenStr, 10);
    const ageDays = (Date.now() - firstSeenMs) / (1000 * 60 * 60 * 24);

    if (ageDays >= 7) {
      return 5.0;
    } else if (ageDays >= 3) {
      return 2.5;
    }
    return 1.0;
  }

  private ensureDeviceIdentity(): void {
    if (!this.getItem(this.DEVICE_SALT_KEY)) {
      const randomArray = new Uint8Array(32);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(randomArray);
      } else {
        for (let i = 0; i < 32; i++) randomArray[i] = Math.floor(Math.random() * 256);
      }
      const saltHex = Array.from(randomArray).map(b => b.toString(16).padStart(2, '0')).join('');
      this.setItem(this.DEVICE_SALT_KEY, saltHex);
    }
    if (!this.getItem(this.FIRST_SEEN_KEY)) {
      this.setItem(this.FIRST_SEEN_KEY, Date.now().toString());
    }
  }

  private getDeviceSalt(): string {
    this.ensureDeviceIdentity();
    return this.getItem(this.DEVICE_SALT_KEY) || 'default_device_salt';
  }

  private inMemoryStorage: Record<string, string> = {};

  private getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {}
    return this.inMemoryStorage[key] || null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
        return;
      }
    } catch {}
    this.inMemoryStorage[key] = value;
  }
}
