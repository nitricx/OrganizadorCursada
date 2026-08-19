import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lineage-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lineage-indicator.component.html',
  styleUrl: './lineage-indicator.component.css'
})
export class LineageIndicatorComponent {
  forkOf = input<string | undefined>(undefined);
  parentName = input<string | undefined>(undefined);
  onCompare = output<void>();
}
