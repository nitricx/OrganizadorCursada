import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-advisory-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="conflictCount > 0" class="advisory-badge-container">
      <span class="badge-icon">⚠️</span>
      <span class="badge-text">
        Actualización de plan disponible ({{ conflictCount }} aviso{{ conflictCount > 1 ? 's' : '' }})
      </span>
      <button class="btn-inspect" (click)="onInspect.emit()">
        Revisar Cambios
      </button>
    </div>
  `,
  styles: [`
    .advisory-badge-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      border-radius: 20px;
      color: #f59e0b;
      font-size: 0.85rem;
      font-weight: 500;
      backdrop-filter: blur(8px);
    }
    .btn-inspect {
      background: #f59e0b;
      color: #111;
      border: none;
      border-radius: 12px;
      padding: 3px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-inspect:hover {
      opacity: 0.9;
      transform: scale(1.03);
    }
  `]
})
export class AdvisoryBadgeComponent {
  @Input() conflictCount: number = 0;
  @Output() onInspect = new EventEmitter<void>();
}
