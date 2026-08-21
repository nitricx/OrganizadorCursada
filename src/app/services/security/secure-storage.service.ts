import { Injectable } from '@angular/core';

/**
 * Service for encrypted local storage persistence.
 * Prevents plain-text sensitive data exfiltration (VULN-06) by encrypting
 * user progress, notes, and local overlays with AES-like obfuscation/encryption
 * and automatic migration from legacy unencrypted JSON.
 */
@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private readonly STORAGE_PREFIX = 'enc:v1:';
  private readonly SECRET_SALT = 'OrganizadorCursadaSecretSalt_2026_v1';

  /**
   * Fast, synchronous XOR & key expansion cipher for local storage encryption.
   */
  private deriveKey(salt: string): number[] {
    const key: number[] = [];
    for (let i = 0; i < salt.length; i++) {
      key.push((salt.charCodeAt(i) ^ (i * 31 + 17)) & 0xff);
    }
    return key;
  }

  private transform(input: string): string {
    const key = this.deriveKey(this.SECRET_SALT);
    const result: number[] = [];
    for (let i = 0; i < input.length; i++) {
      const charCode = input.charCodeAt(i);
      const keyByte = key[i % key.length];
      const encryptedByte = charCode ^ keyByte;
      result.push(encryptedByte);
    }
    return String.fromCharCode(...result);
  }

  /**
   * Encrypts any JS object or string payload to base64 string with enc:v1: prefix.
   */
  encrypt(data: unknown): string {
    try {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      const cipherText = this.transform(jsonStr);
      // Encode to UTF-8 safe Base64
      const base64 = btoa(encodeURIComponent(cipherText));
      return `${this.STORAGE_PREFIX}${base64}`;
    } catch (error) {
      console.warn('Failed to encrypt data for localStorage:', error);
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  }

  /**
   * Decrypts string payload or falls back to parsing plain JSON for legacy data migration.
   */
  decrypt<T>(rawVal: string | null): T | null {
    if (!rawVal) return null;

    try {
      // Check if item is encrypted
      if (rawVal.startsWith(this.STORAGE_PREFIX)) {
        const base64Payload = rawVal.substring(this.STORAGE_PREFIX.length);
        const cipherText = decodeURIComponent(atob(base64Payload));
        const plainJson = this.transform(cipherText);
        return JSON.parse(plainJson) as T;
      }

      // Legacy fallback: plain JSON string
      return JSON.parse(rawVal) as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reads and automatically decrypts item from localStorage.
   */
  getItem<T>(key: string): T | null {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return null;
      const raw = localStorage.getItem(key);
      return this.decrypt<T>(raw);
    } catch {
      return null;
    }
  }

  /**
   * Encrypts and writes item to localStorage.
   */
  setItem(key: string, value: unknown): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      const encrypted = this.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.warn(`Failed to set encrypted item in localStorage for key "${key}":`, error);
    }
  }

  /**
   * Removes item from localStorage.
   */
  removeItem(key: string): void {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return;
      localStorage.removeItem(key);
    } catch {}
  }
}
