import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RebaseConflict } from '../../models/plan-manifest.model';

@Component({
  selector: 'app-plan-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-diff-viewer.component.html',
  styleUrl: './plan-diff-viewer.component.css'
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
