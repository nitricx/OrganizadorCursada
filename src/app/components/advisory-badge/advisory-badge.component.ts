import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-advisory-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './advisory-badge.component.html',
  styleUrl: './advisory-badge.component.css'
})
export class AdvisoryBadgeComponent {
  @Input() conflictCount: number = 0;
  @Output() onInspect = new EventEmitter<void>();
}
