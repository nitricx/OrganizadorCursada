import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-welcome.component.html',
  styleUrl: './onboarding-welcome.component.css'
})
export class OnboardingWelcomeComponent {
  @Output() onOpenWorkshop = new EventEmitter<void>();
  @Output() onImportPlan = new EventEmitter<void>();
  @Output() onLoadDemoPlan = new EventEmitter<void>();
}
