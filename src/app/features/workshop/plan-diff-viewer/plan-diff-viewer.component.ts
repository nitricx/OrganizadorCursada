import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RebaseConflict } from '../../../models/plan-manifest.model';

@Component({
  selector: 'app-plan-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-diff-viewer.component.html',
  styleUrl: './plan-diff-viewer.component.css'
})
export class PlanDiffViewerComponent {
  conflicts = input<RebaseConflict[]>([]);
  closeModal = output<void>();
  applyChanges = output<void>();

  formatVal(val: unknown): string {
    if (!val) return 'Ninguna';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
