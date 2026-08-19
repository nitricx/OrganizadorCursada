import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PlanManifest } from '../models/plan-manifest.model';

export interface FacultyBundle {
  facultyKey: string;
  updatedAt: string;
  modules: Record<string, PlanManifest>;
}

@Injectable({
  providedIn: 'root'
})
export class StaticBundleFetcherService {
  private http = inject(HttpClient);

  /**
   * Layer 1: Static CDN Blind Broadcast Fetcher.
   * Downloads a coarse faculty bundle containing all degree manifests for a given faculty.
   * All students download the exact same static bundle file, blending queries into a k-anonymous crowd.
   */
  public async fetchFacultyBundle(cdnBaseUrl: string, facultyKey: string): Promise<FacultyBundle> {
    const url = `${cdnBaseUrl}/updates/bundles/${facultyKey}.json`;
    try {
      const bundle = await firstValueFrom(this.http.get<FacultyBundle>(url));
      return bundle;
    } catch (err) {
      console.warn(`Failed to fetch faculty bundle ${facultyKey} from static CDN:`, err);
      return { facultyKey, updatedAt: new Date().toISOString(), modules: {} };
    }
  }

  /**
   * Layer 2: Hash-Prefix k-Anonymity Fetching (HaveIBeenPwned model for Modular Elective Packs).
   * Queries 4-character hex prefix endpoint returning 100-250 modules for local in-memory extraction.
   */
  public async fetchPrefixBucket(cdnBaseUrl: string, targetModuleId: string): Promise<PlanManifest | null> {
    const encoder = new TextEncoder();
    const data = encoder.encode(targetModuleId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fullHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hexPrefix = fullHashHex.substring(0, 4);

    const url = `${cdnBaseUrl}/updates/prefix/${hexPrefix}.json`;
    try {
      const bucket = await firstValueFrom(this.http.get<Record<string, PlanManifest>>(url));
      return bucket[targetModuleId] || null;
    } catch (err) {
      console.warn(`Failed to fetch prefix bucket ${hexPrefix} from static CDN:`, err);
      return null;
    }
  }
}
