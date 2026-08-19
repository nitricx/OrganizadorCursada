import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-advisory-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advisory-badge.component.html',
  styleUrl: './advisory-badge.component.css'
})
export class AdvisoryBadgeComponent {
  conflictCount = input<number>(0);
  onInspect = output<void>();
}
