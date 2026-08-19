import { Injectable, inject } from '@angular/core';
import { PlanManifest, UserProgressOverlay } from '../models/plan-manifest.model';
import { PlanSanitizerService } from './plan-sanitizer.service';
import { PlanLinterService } from './plan-linter.service';

export interface ExportedUserStatePackage {
  formatMarker: 'ORG_CURSADA_PRIVATE_USER_STATE_V1';
  warningHeader: 'Private Personal Progress — DO NOT upload to public spaces.';
  exportedAt: string;
  overlay: UserProgressOverlay;
  manifest: PlanManifest;
}

export interface ExportedPublicPlanPackage {
  formatMarker: 'ORG_CURSADA_PUBLIC_PLAN_V1';
  exportedAt: string;
  manifest: PlanManifest;
}

@Injectable({
  providedIn: 'root'
})
export class PlanImportExportService {
  private sanitizer = inject(PlanSanitizerService);
  private linter = inject(PlanLinterService);

  /**
   * Pipeline A: Personal local state backup export (.orgcursada-userstate).
   * Embeds mandatory header warning to prevent public upload leaks.
   */
  public exportPersonalUserState(overlay: UserProgressOverlay, manifest: PlanManifest): string {
    const pkg: ExportedUserStatePackage = {
      formatMarker: 'ORG_CURSADA_PRIVATE_USER_STATE_V1',
      warningHeader: 'Private Personal Progress — DO NOT upload to public spaces.',
      exportedAt: new Date().toISOString(),
      overlay,
      manifest
    };
    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Pipeline B: Public Workshop asset export (.orgcursada-plan).
   * Passes payload through PlanSanitizerService and PlanLinterService.
   */
  public exportPublicWorkshopPlan(rawManifest: PlanManifest): string {
    const sanitized = this.sanitizer.sanitizeForPublishing(rawManifest);
    const lintRes = this.linter.lintPlanManifest(sanitized);

    if (!lintRes.valid) {
      throw new Error(`Public export failed validation: ${lintRes.errors.join(', ')}`);
    }

    const pkg: ExportedPublicPlanPackage = {
      formatMarker: 'ORG_CURSADA_PUBLIC_PLAN_V1',
      exportedAt: new Date().toISOString(),
      manifest: sanitized
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Imports a plan package or user state backup.
   * Explicitly rejects personal state backups when attempting public Workshop upload.
   */
  public importPackage(jsonString: string, isWorkshopUploadContext: boolean = false): {
    manifest: PlanManifest;
    overlay?: UserProgressOverlay;
  } {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('El archivo no contiene un formato JSON válido.');
    }

    // Safety check: Reject private state packages in Workshop upload context
    if (isWorkshopUploadContext && parsed.formatMarker === 'ORG_CURSADA_PRIVATE_USER_STATE_V1') {
      throw new Error('RECHAZADO: Este archivo contiene su avance personal privado y no puede subirse al Workshop público.');
    }

    if (parsed.formatMarker === 'ORG_CURSADA_PRIVATE_USER_STATE_V1') {
      return {
        manifest: parsed.manifest,
        overlay: parsed.overlay
      };
    }

    const manifestCandidate = parsed.manifest || parsed;
    const sanitized = this.sanitizer.sanitizeForPublishing(manifestCandidate);
    const lintRes = this.linter.lintPlanManifest(sanitized);

    if (!lintRes.valid) {
      throw new Error(`Error en el plan importado: ${lintRes.errors.join('; ')}`);
    }

    return {
      manifest: sanitized
    };
  }
}
