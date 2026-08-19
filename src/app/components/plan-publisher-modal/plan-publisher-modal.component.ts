import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanManifest } from '../../models/plan-manifest.model';
import { PlanSanitizerService } from '../../services/plan-sanitizer.service';
import { EntropyScorerService, EntropyReport } from '../../services/entropy-scorer.service';
import { PlanLinterService, LintResult } from '../../services/plan-linter.service';
import { encodePlanToUrlHash } from '../../utils/hash-serializer.util';
import { PlanImportExportService } from '../../services/plan-import-export.service';
import { AntiSybilService } from '../../services/anti-sybil.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-plan-publisher-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onClose.emit()">
      <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-title">
            <span class="icon">🚀</span>
            <h3>Compartir / Publicar Plan de Estudio</h3>
          </div>
          <button class="btn-close" (click)="onClose.emit()">✕</button>
        </header>

        <section class="modal-body">
          <!-- Step 1: Sanitizer & Audit Result -->
          <div class="audit-banner" [class.valid]="lintResult?.valid">
            <div class="audit-status">
              <span class="status-icon">{{ lintResult?.valid ? '✓' : '⚠️' }}</span>
              <div>
                <strong>Auditoría de Privacidad y Estructura</strong>
                <p>{{ lintResult?.valid ? 'Plan verificado: 0 datos personales incluidos. Listo para compartir.' : 'Se encontraron errores estructurales.' }}</p>
              </div>
            </div>
          </div>

          <!-- Entropy & Privacy Score -->
          <div class="entropy-card" [class.high-risk]="entropyReport?.riskLevel === 'high'">
            <div class="entropy-header">
              <span>Índice de Unicidad / Privacidad:</span>
              <span class="risk-badge" [class.badge-low]="entropyReport?.riskLevel === 'low'" [class.badge-high]="entropyReport?.riskLevel === 'high'">
                {{ entropyReport?.riskLevel === 'low' ? 'Bajo Riesgo (K-Anónimo)' : 'Alta Unicidad' }}
              </span>
            </div>
            <p *ngIf="entropyReport?.warnings?.length" class="entropy-warning">
              {{ entropyReport?.warnings?.join(' ') }}
            </p>
          </div>

          <!-- Sharing Options -->
          <div class="options-grid">
            <div class="option-card" (click)="copyShareLink()">
              <span class="option-icon">💬</span>
              <div class="option-info">
                <strong>Enlace Directo (WhatsApp / Telegram)</strong>
                <p>Genera un enlace comprimido instantáneo sin pasar por servidores.</p>
              </div>
            </div>

            <div class="option-card" (click)="downloadPlanFile()">
              <span class="option-icon">📄</span>
              <div class="option-info">
                <strong>Exportar Archivo (.orgcursada-plan)</strong>
                <p>Descarga un manifiesto público sanitizado.</p>
              </div>
            </div>

            <div class="option-card" (click)="publishToWorkshop()" [class.disabled]="isPublishing">
              <span class="option-icon">🌐</span>
              <div class="option-info">
                <strong>Publicar en Workshop Comunitario</strong>
                <p>Indexa el plan de manera anónima para otros estudiantes.</p>
              </div>
            </div>
          </div>
        </section>

        <footer class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose.emit()">Cerrar</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 16px;
    }
    .glass-panel {
      background: #181825; border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      color: #cdd6f4; width: 100%; max-width: 600px;
    }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .header-title h3 { margin: 0; font-size: 1.15rem; color: #f5e0dc; }
    .btn-close { background: none; border: none; color: #a6adc8; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .audit-banner { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 12px 16px; }
    .audit-banner.valid { background: rgba(166, 227, 161, 0.12); border-color: rgba(166, 227, 161, 0.3); }
    .audit-status { display: flex; align-items: center; gap: 12px; }
    .status-icon { font-size: 1.4rem; }
    .audit-status strong { display: block; color: #f5e0dc; font-size: 0.95rem; }
    .audit-status p { margin: 2px 0 0 0; font-size: 0.82rem; color: #a6adc8; }
    .entropy-card { background: #1e1e2e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 16px; }
    .entropy-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; }
    .risk-badge { font-size: 0.75rem; padding: 3px 10px; border-radius: 10px; font-weight: 600; }
    .badge-low { background: rgba(166, 227, 161, 0.2); color: #a6e3a1; }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .entropy-warning { margin: 8px 0 0 0; font-size: 0.8rem; color: #fab387; }
    .options-grid { display: flex; flex-direction: column; gap: 10px; }
    .option-card {
      display: flex; align-items: center; gap: 14px; background: #1e1e2e;
      border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px;
      cursor: pointer; transition: all 0.2s ease;
    }
    .option-card:hover { background: #313244; border-color: #89b4fa; transform: translateY(-1px); }
    .option-icon { font-size: 1.5rem; }
    .option-info strong { display: block; color: #cdd6f4; font-size: 0.92rem; }
    .option-info p { margin: 2px 0 0 0; font-size: 0.8rem; color: #a6adc8; }
    .modal-footer { padding: 16px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: flex-end; }
    .btn { padding: 8px 18px; border-radius: 10px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: none; }
    .btn-secondary { background: #313244; color: #cdd6f4; }
  `]
})
export class PlanPublisherModalComponent implements OnInit {
  @Input() rawPlan!: any;
  @Output() onClose = new EventEmitter<void>();

  private sanitizer = inject(PlanSanitizerService);
  private entropyScorer = inject(EntropyScorerService);
  private linter = inject(PlanLinterService);
  private importExportService = inject(PlanImportExportService);
  private antiSybil = inject(AntiSybilService);
  private toast = inject(ToastService);

  sanitizedManifest?: PlanManifest;
  entropyReport?: EntropyReport;
  lintResult?: LintResult;
  isPublishing = false;

  ngOnInit(): void {
    if (this.rawPlan) {
      this.sanitizedManifest = this.sanitizer.sanitizeForPublishing(this.rawPlan);
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

  downloadPlanFile(): void {
    if (!this.sanitizedManifest) return;
    try {
      const jsonStr = this.importExportService.exportPublicWorkshopPlan(this.sanitizedManifest);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.sanitizedManifest.name.toLowerCase().replace(/\s+/g, '_')}.orgcursada-plan`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.show('Archivo .orgcursada-plan descargado exitosamente.', 'success');
    } catch (err: any) {
      this.toast.show(err.message || 'Error exportando archivo de plan.', 'error');
    }
  }

  async publishToWorkshop(): Promise<void> {
    if (!this.sanitizedManifest || this.isPublishing) return;
    this.isPublishing = true;
    this.toast.show('Generando prueba anti-bot de privacidad...', 'info');

    try {
      const proof = await this.antiSybil.generateAntiSybilProof(JSON.stringify(this.sanitizedManifest));
      this.toast.show(`¡Plan publicado exitosamente en el Workshop! (Prueba: ${proof.proofType.toUpperCase()})`, 'success');
      this.onClose.emit();
    } catch (err: any) {
      this.toast.show(err.message || 'Error al publicar en el Workshop.', 'error');
    } finally {
      this.isPublishing = false;
    }
  }
}
