import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lineage-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="forkOf" class="lineage-container">
      <span class="fork-icon">🔀</span>
      <span class="lineage-label">
        Plan derivado de: <strong>{{ parentName || forkOf }}</strong>
      </span>
      <button class="btn-compare" (click)="onCompare.emit()">
        Ver diferencias con el original
      </button>
    </div>
  `,
  styles: [`
    .lineage-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 16px;
      color: #818cf8;
      font-size: 0.8rem;
    }
    .btn-compare {
      background: transparent;
      border: 1px solid rgba(99, 102, 241, 0.5);
      color: #a5b4fc;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 0.72rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .btn-compare:hover {
      background: rgba(99, 102, 241, 0.25);
    }
  `]
})
export class LineageIndicatorComponent {
  @Input() forkOf?: string;
  @Input() parentName?: string;
  @Output() onCompare = new EventEmitter<void>();
}
