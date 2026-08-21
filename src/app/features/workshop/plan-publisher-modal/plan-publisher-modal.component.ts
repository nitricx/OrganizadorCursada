import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanManifest } from '../../../models/plan-manifest.model';
import { PlanSanitizerService } from '../../../services/plan-sanitizer.service';
import { EntropyScorerService, EntropyReport } from '../../../services/entropy-scorer.service';
import { PlanLinterService, LintResult } from '../../../services/plan-linter.service';
import { encodePlanToUrlHash } from '../../../utils/hash-serializer.util';
import { AntiSybilService } from '../../../services/anti-sybil.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-plan-publisher-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-publisher-modal.component.html',
  styleUrl: './plan-publisher-modal.component.css'
})
export class PlanPublisherModalComponent implements OnInit {
  rawPlan = input<unknown>();
  onClose = output<void>();

  private sanitizer = inject(PlanSanitizerService);
  private entropyScorer = inject(EntropyScorerService);
  private linter = inject(PlanLinterService);
  private antiSybil = inject(AntiSybilService);
  private toast = inject(ToastService);

  sanitizedManifest?: PlanManifest;
  entropyReport?: EntropyReport;
  lintResult?: LintResult;
  isPublishing = false;

  ngOnInit(): void {
    const planData = this.rawPlan();
    if (planData) {
      this.sanitizedManifest = this.sanitizer.sanitizeForPublishing(planData as Record<string, unknown>);
      this.entropyReport = this.entropyScorer.calculatePlanEntropy(this.sanitizedManifest);
      this.lintResult = this.linter.lintPlanManifest(this.sanitizedManifest);
    }
  }

  copyShareLink(): void {
    if (!this.sanitizedManifest) return;
    try {
      const hashStr = encodePlanToUrlHash(this.sanitizedManifest);
      const fullUrl = `${window.location.origin}${window.location.pathname}#import=${hashStr}`;
      navigator.clipboard.writeText(fullUrl);
      this.toast.show('¡Enlace de WhatsApp/Telegram copiado al portapapeles!', 'success');
    } catch {
      this.toast.show('Error al generar el enlace de compartir.', 'error');
    }
  }

  async publishToWorkshop(): Promise<void> {
    if (!this.sanitizedManifest || this.isPublishing) return;
    this.isPublishing = true;
    this.toast.show('Generando prueba anti-bot de privacidad...', 'info');

    try {
      const payloadStr = JSON.stringify(this.sanitizedManifest);
      const proof = await this.antiSybil.generateAntiSybilProof(payloadStr);
      const isValid = await this.antiSybil.verifyProofLocally(proof, payloadStr);
      if (!isValid) {
        throw new Error('La prueba anti-bot es inválida o ha expirado.');
      }
      const verificationPayload = this.antiSybil.buildVerificationPayload(proof, payloadStr);
      // Attach verificationPayload for submission to Workshop backend API
      this.toast.show(`¡Plan publicado exitosamente en el Workshop! (Prueba: ${proof.proofType.toUpperCase()})`, 'success');
      this.onClose.emit();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al publicar en el Workshop.';
      this.toast.show(message, 'error');
    } finally {
      this.isPublishing = false;
    }
  }
}
