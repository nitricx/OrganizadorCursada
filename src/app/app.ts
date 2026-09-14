import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { CareerSelectorComponent } from './features/workshop/career-selector/career-selector.component';
import { WorkshopHubComponent } from './features/workshop/workshop-hub/workshop-hub.component';
import { PlanPublisherModalComponent } from './features/workshop/plan-publisher-modal/plan-publisher-modal.component';
import { PlanDiffViewerComponent } from './features/workshop/plan-diff-viewer/plan-diff-viewer.component';
import { UserMenuComponent } from './shared/components/user-menu/user-menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ThemeService } from './services/theme.service';
import { PlanService } from './services/plan.service';
import { CourseService } from './services/course.service';
import { CareerService } from './services/career.service';
import { ToastService } from './services/toast.service';
import { decodePlanFromUrlHash } from './utils/hash-serializer.util';
import { PlanManifest } from './models/plan-manifest.model';

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
  private careerService = inject(CareerService);
  private courseService = inject(CourseService);
  private toast = inject(ToastService);
  private router = inject(Router);

  isOpen = signal(true);
  private internalWorkshopSignal = signal(false);
  showWorkshop = computed(() => this.internalWorkshopSignal() || this.planService.isWorkshopOpen());
  showPublisher = signal(false);
  showDiffViewer = signal(false);

  plans = this.planService.plans;

  currentPlanToPublish = signal<unknown>(null);

  ngOnInit(): void {
    // URL Hash Fragment Listener for 1-Click P2P Link Import (#import=...)
    if (window.location.hash && window.location.hash.includes('import=')) {
      try {
        const decoded = decodePlanFromUrlHash(window.location.hash);
        if (decoded && decoded.name) {
          const planId = this.careerService.addCareerFromManifest(decoded);
          this.planService.addPlan({ id: planId, label: decoded.name });
          this.router.navigate(['/home']);
          this.toast.show(`¡Plan "${decoded.name}" importado exitosamente desde el enlace de WhatsApp/Telegram!`, 'success');
          // Clear hash
          history.replaceState(null, '', window.location.pathname);
        }
      } catch {
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
    this.router.navigate(['/publish']);
  }

  handleSubscribePlan(manifest: PlanManifest): void {
    const planId = this.careerService.addCareerFromManifest(manifest);
    this.planService.addPlan({ id: planId, label: manifest.name });
    this.router.navigate(['/home']);
    this.toast.show(`Plan "${manifest.name}" añadido a tus planes de estudio.`, 'success');
  }

  handleLoadDemoPlan(): void {
    this.careerService.selectCareer('lic-diseno-audiovisual');
    if (this.planService.plans().length === 0) {
      this.planService.addPlan({ id: '1', label: 'Licenciatura en Diseño Audiovisual' });
    }
    this.router.navigate(['/home']);
    this.toast.show('¡Plan de demostración cargado correctamente!', 'success');
  }

  openWorkshop(): void {
    this.router.navigate(['/workshop']);
  }

  closeWorkshop(): void {
    this.router.navigate(['/home']);
  }

  resetToNewUser(): void {
    this.planService.resetToNewUser();
    this.toast.show('Sesión reiniciada. Se activó el modo de nuevo usuario.', 'info');
  }
}
