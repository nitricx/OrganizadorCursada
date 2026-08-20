import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding-welcome.component.html',
  styleUrl: './onboarding-welcome.component.css'
})
export class OnboardingWelcomeComponent {
  onOpenWorkshop = output<void>();
  onLoadDemoPlan = output<void>();
}
