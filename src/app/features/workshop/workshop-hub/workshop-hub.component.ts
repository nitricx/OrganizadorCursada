import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlanManifest } from '../../../models/plan-manifest.model';
import { ToastService } from '../../../services/toast.service';
import { normalizeString } from '../../../utils/string.utils';
import { CareerService } from '../../../services/career.service';
import { PlanService } from '../../../services/plan.service';

import sistemasPlan from '../../../../../scripts/seed-data/sistemas.json';
import audiovisualPlan from '../../../../../scripts/seed-data/audiovisual.json';

export interface WorkshopEntry {
  id: string;
  name: string;
  university: string;
  faculty: string;
  version: string;
  updatedAt: string;
  manifest: PlanManifest;
}

export type SortColumn = 'name' | 'faculty' | 'university';
export type SortDirection = 'asc' | 'desc';

const DEFAULT_CATALOG: WorkshopEntry[] = [
  {
    id: audiovisualPlan.id,
    name: audiovisualPlan.name,
    university: audiovisualPlan.university,
    faculty: audiovisualPlan.faculty,
    version: audiovisualPlan.version,
    updatedAt:
      ((audiovisualPlan as Record<string, unknown>)['updatedAt'] as string) || '2026-08-19',
    manifest: audiovisualPlan as unknown as PlanManifest,
  },
  {
    id: sistemasPlan.id,
    name: sistemasPlan.name,
    university: sistemasPlan.university,
    faculty: sistemasPlan.faculty,
    version: sistemasPlan.version,
    updatedAt: ((sistemasPlan as Record<string, unknown>)['updatedAt'] as string) || '2026-08-19',
    manifest: sistemasPlan as unknown as PlanManifest,
  },
];

@Component({
  selector: 'app-workshop-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './workshop-hub.component.html',
  styleUrl: './workshop-hub.component.css',
})
export class WorkshopHubComponent {
  closeModal = output<void>();
  planSubscribed = output<PlanManifest>();

  private readonly toast = inject(ToastService);
  private readonly careerService = inject(CareerService);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);

  searchQuery = '';
  selectedUniversity = 'all';
  selectedFaculty = 'all';
  catalog: WorkshopEntry[] = [...DEFAULT_CATALOG];
  sortColumn: SortColumn = 'name';
  sortDirection: SortDirection = 'asc';

  get universities(): string[] {
    const set = new Set(this.catalog.map((c) => c.university).filter(Boolean));
    return Array.from(set).sort();
  }

  get faculties(): string[] {
    const set = new Set(this.catalog.map((c) => c.faculty).filter(Boolean));
    return Array.from(set).sort();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedUniversity = 'all';
    this.selectedFaculty = 'all';
  }

  isSubscribed(item: WorkshopEntry): boolean {
    return this.careerService.careers().some((c) => c.id === item.id);
  }

  unsubscribePlan(item: WorkshopEntry, event: Event): void {
    event.stopPropagation();
    this.careerService.removeCareer(item.id);
    this.toast.show(`Te has desuscrito del plan "${item.name}".`, 'info');
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) return '↕️';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  get filteredAndSortedCatalog(): WorkshopEntry[] {
    let list = this.catalog;

    if (this.selectedUniversity !== 'all') {
      list = list.filter((c) => c.university === this.selectedUniversity);
    }

    if (this.selectedFaculty !== 'all') {
      list = list.filter((c) => c.faculty === this.selectedFaculty);
    }

    if (this.searchQuery.trim()) {
      const q = normalizeString(this.searchQuery);
      list = list.filter(
        (c) =>
          normalizeString(c.name).includes(q) ||
          normalizeString(c.university).includes(q) ||
          normalizeString(c.faculty).includes(q),
      );
    }

    const col = this.sortColumn;
    const dirMultiplier = this.sortDirection === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      const valA = (a[col] || '').toLowerCase();
      const valB = (b[col] || '').toLowerCase();
      return valA.localeCompare(valB, 'es', { sensitivity: 'base' }) * dirMultiplier;
    });
  }

  subscribePlan(item: WorkshopEntry): void {
    const planId = this.careerService.addCareerFromManifest(item.manifest);
    this.planService.addPlan({ id: planId, label: item.name });
    this.planSubscribed.emit(item.manifest);
    this.toast.show(`¡Suscrito al plan "${item.name}"!`, 'success');
    this.closeModal.emit();
    this.router.navigate(['/home']);
  }
}
