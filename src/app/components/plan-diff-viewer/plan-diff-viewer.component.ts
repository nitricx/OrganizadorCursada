import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RebaseConflict } from '../../models/plan-manifest.model';

@Component({
  selector: 'app-plan-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onClose.emit()">
      <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-title">
            <span class="icon">🔍</span>
            <h3>Inspeccionador de Cambios del Plan</h3>
          </div>
          <button class="btn-close" (click)="onClose.emit()">✕</button>
        </header>

        <section class="modal-body">
          <p class="subtitle">
            Se encontraron los siguientes cambios entre la versión oficial guardada y la versión actualizada:
          </p>

          <div class="conflicts-list">
            <div *ngFor="let conflict of conflicts" class="conflict-card" [class.danger]="conflict.type === 'course_removed'">
              <div class="conflict-header">
                <span class="tag" [class.tag-warning]="conflict.type === 'prerequisite_modified'" [class.tag-danger]="conflict.type === 'course_removed'">
                  {{ conflict.type === 'prerequisite_modified' ? 'Correlativa Modificada' : (conflict.type === 'course_removed' ? 'Materia Eliminada' : 'Cambio de Semestre') }}
                </span>
                <strong class="course-name">{{ conflict.courseName }}</strong>
              </div>
              <p class="description">{{ conflict.description }}</p>
              
              <div *ngIf="conflict.oldValue || conflict.newValue" class="diff-comparison">
                <div class="diff-col old-val">
                  <span class="label">Anterior:</span>
                  <code>{{ formatVal(conflict.oldValue) }}</code>
                </div>
                <div class="diff-arrow">➔</div>
                <div class="diff-col new-val">
                  <span class="label">Actualizado:</span>
                  <code>{{ formatVal(conflict.newValue) }}</code>
                </div>
              </div>
            </div>
          </div>

          <div class="privacy-reassurance">
            <span>🛡️</span>
            <span>Sus notas personales, estados de avance ('aprobada', 'cursando') y materias completadas permanecen 100% intactas.</span>
          </div>
        </section>

        <footer class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose.emit()">Conservar Plan Actual</button>
          <button class="btn btn-primary" (click)="onApply.emit()">Aplicar Cambios</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 16px;
    }
    .glass-panel {
      background: #181825;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      color: #cdd6f4;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .header-title h3 { margin: 0; font-size: 1.2rem; color: #f5e0dc; }
    .btn-close { background: none; border: none; color: #a6adc8; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .subtitle { font-size: 0.9rem; color: #a6adc8; margin: 0; }
    .conflicts-list { display: flex; flex-direction: column; gap: 12px; }
    .conflict-card {
      background: #1e1e2e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 14px;
    }
    .conflict-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .tag { font-size: 0.72rem; padding: 2px 8px; border-radius: 8px; font-weight: 600; text-transform: uppercase; }
    .tag-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .tag-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .course-name { font-size: 1rem; color: #cdd6f4; }
    .description { font-size: 0.85rem; color: #bac2de; margin: 4px 0 8px 0; }
    .diff-comparison { display: flex; align-items: center; gap: 10px; background: #11111b; padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; }
    .diff-col { flex: 1; }
    .diff-col .label { display: block; font-size: 0.7rem; color: #6c7086; margin-bottom: 2px; }
    code { font-family: monospace; color: #a6e3a1; }
    .privacy-reassurance {
      display: flex; align-items: center; gap: 10px;
      background: rgba(137, 180, 250, 0.1);
      border: 1px solid rgba(137, 180, 250, 0.2);
      padding: 10px 14px; border-radius: 10px; font-size: 0.82rem; color: #89b4fa;
    }
    .modal-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex; justify-content: flex-end; gap: 12px; background: #181825;
    }
    .btn { padding: 8px 18px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; border: none; }
    .btn-secondary { background: #313244; color: #cdd6f4; }
    .btn-primary { background: #89b4fa; color: #11111b; }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
  `]
})
export class PlanDiffViewerComponent {
  @Input() conflicts: RebaseConflict[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onApply = new EventEmitter<void>();

  formatVal(val: any): string {
    if (!val) return 'Ninguna';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
