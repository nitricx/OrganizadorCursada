import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { CareerSelectorComponent } from './components/career-selector/career-selector.component';
import { WorkshopHubComponent } from './components/workshop-hub/workshop-hub.component';
import { PlanPublisherModalComponent } from './components/plan-publisher-modal/plan-publisher-modal.component';
import { PlanDiffViewerComponent } from './components/plan-diff-viewer/plan-diff-viewer.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UserMenuComponent } from './components/user-menu/user-menu';
import { ThemeService } from './services/theme.service';
import { PlanService } from './services/plan.service';
import { CourseService } from './services/course.service';
import { ToastService } from './services/toast.service';
import { decodePlanFromUrlHash } from './utils/hash-serializer.util';
import { PlanManifest } from './models/plan-manifest.model';

import { OnboardingWelcomeComponent } from './components/onboarding-welcome/onboarding-welcome.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SidebarComponent,
    ToastContainerComponent,
    CareerSelectorComponent,
    UserMenuComponent,
    WorkshopHubComponent,
    PlanPublisherModalComponent,
    PlanDiffViewerComponent,
    OnboardingWelcomeComponent,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  themeService = inject(ThemeService);
  planService = inject(PlanService);
  private courseService = inject(CourseService);
  private toast = inject(ToastService);

  isOpen = signal(true);
  showWorkshop = signal(false);
  showPublisher = signal(false);
  showDiffViewer = signal(false);

  plans = this.planService.plans;

  currentPlanToPublish = signal<any>(null);

  ngOnInit(): void {
    // URL Hash Fragment Listener for 1-Click P2P Link Import (#import=...)
    if (window.location.hash && window.location.hash.includes('import=')) {
      try {
        const decoded = decodePlanFromUrlHash(window.location.hash);
        if (decoded && decoded.name) {
          const nextId = String(Date.now());
          this.planService.addPlan({ id: nextId, label: decoded.name });
          this.toast.show(`¡Plan "${decoded.name}" importado exitosamente desde el enlace de WhatsApp/Telegram!`, 'success');
          // Clear hash
          history.replaceState(null, '', window.location.pathname);
        }
      } catch (err: any) {
        this.toast.show('Error al importar el plan desde el enlace.', 'error');
      }
    }
  }

  openPublisher(): void {
    const activeCareer = this.courseService.courses();
    this.currentPlanToPublish.set({
      id: 'plan_current',
      name: 'Mi Plan Actual',
      university: 'Universidad',
      version: '1.0.0',
      courses: activeCareer
    });
    this.showPublisher.set(true);
  }

  handleSubscribePlan(manifest: PlanManifest): void {
    const nextId = String(Date.now());
    this.planService.addPlan({ id: nextId, label: manifest.name });
    this.toast.show(`Plan "${manifest.name}" añadido a tus planes de estudio.`, 'success');
  }

  handleLoadDemoPlan(): void {
    const demoId = String(Date.now());
    this.planService.addPlan({ id: demoId, label: 'Licenciatura en Diseño Audiovisual (Demo)' });
    this.toast.show('¡Plan de demostración cargado correctamente!', 'success');
  }

  handleImportPlan(): void {
    this.showWorkshop.set(true);
  }

  resetToNewUser(): void {
    this.planService.resetToNewUser();
    this.toast.show('Sesión reiniciada. Se activó el modo de nuevo usuario.', 'info');
  }
}
