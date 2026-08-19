import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lineage-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lineage-indicator.component.html',
  styleUrl: './lineage-indicator.component.css'
})
export class LineageIndicatorComponent {
  @Input() forkOf?: string;
  @Input() parentName?: string;
  @Output() onCompare = new EventEmitter<void>();
}
