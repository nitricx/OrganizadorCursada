import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CareerService } from '../../../services/career.service';
import { ToastService } from '../../../services/toast.service';
import { CareerIndexEntry } from '../../../models/career.model';

@Component({
  selector: 'app-career-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './career-selector.component.html',
  styleUrl: './career-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareerSelectorComponent {
  @ViewChild(MatMenuTrigger) menuTrigger?: MatMenuTrigger;

  readonly careerService = inject(CareerService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  openWorkshop = output<void>();

  readonly careerToDelete = signal<CareerIndexEntry | null>(null);

  readonly activeCareerName = computed(() => {
    const active = this.careerService.activeCareer();
    const selectedId = this.careerService.selectedCareerId();
    if (!active || !selectedId || active.id === 'empty-plan') {
      return 'Sin Plan Seleccionado';
    }
    const isCustom = selectedId.startsWith('custom-');
    return isCustom ? `${active.name} (Copia local)` : active.name;
  });

  isCustomCareer(careerId: string): boolean {
    return !!careerId && careerId.startsWith('custom-');
  }

  confirmDeleteCareer(career: CareerIndexEntry, event: Event): void {
    event.stopPropagation();
    this.menuTrigger?.closeMenu();
    this.careerToDelete.set(career);
  }

  cancelDelete(): void {
    this.careerToDelete.set(null);
  }

  executeDelete(): void {
    const target = this.careerToDelete();
    if (!target) return;
    this.careerService.removeCareer(target.id);
    this.toastService.info(`Carrera "${target.name}" desuscrita correctamente.`);
    this.careerToDelete.set(null);
  }

  onCareerChange(careerId: string): void {
    this.careerService.selectCareer(careerId);
    const active = this.careerService.activeCareer();
    if (active) {
      this.toastService.info(`Carrera seleccionada: ${active.name}`);
    }
  }

  openPlanHub(): void {
    this.openWorkshop.emit();
    void this.router.navigate(['/workshop']);
  }

  editCurrentPlanInBuilder(): void {
    const activeId = this.careerService.selectedCareerId();
    void this.router.navigate(['/builder'], { queryParams: { planId: activeId } });
  }

  openCareerBuilder(): void {
    void this.router.navigate(['/builder'], { queryParams: { mode: 'new' } });
  }
}
