import { Component, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanManifest } from '../../../models/plan-manifest.model';
import { ToastService } from '../../../services/toast.service';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { normalizeString } from '../../../utils/string.utils';
import { CareerService } from '../../../services/career.service';

import sistemasPlan from '../../../../../scripts/seed-data/sistemas.json';
import audiovisualPlan from '../../../../../scripts/seed-data/audiovisual.json';

export interface WorkshopEntry {
  id: string;
  name: string;
  university: string;
  faculty: string;
  subscribersRange: '< 10' | '10-50' | '50-100' | '100+';
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
    subscribersRange: '100+',
    version: audiovisualPlan.version,
    updatedAt: (audiovisualPlan as Record<string, unknown>)['updatedAt'] as string || '2026-08-19',
    manifest: audiovisualPlan as unknown as PlanManifest
  },
  {
    id: sistemasPlan.id,
    name: sistemasPlan.name,
    university: sistemasPlan.university,
    faculty: sistemasPlan.faculty,
    subscribersRange: '50-100',
    version: sistemasPlan.version,
    updatedAt: (sistemasPlan as Record<string, unknown>)['updatedAt'] as string || '2026-08-19',
    manifest: sistemasPlan as unknown as PlanManifest
  }
];

@Component({
  selector: 'app-workshop-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workshop-hub.component.html',
  styleUrl: './workshop-hub.component.css'
})
export class WorkshopHubComponent implements OnInit {
  onClose = output<void>();
  onSubscribe = output<PlanManifest>();

  private toast = inject(ToastService);
  private firestore = inject(Firestore, { optional: true });
  private careerService = inject(CareerService);

  searchQuery = '';
  catalog: WorkshopEntry[] = [...DEFAULT_CATALOG];
  sortColumn: SortColumn = 'name';
  sortDirection: SortDirection = 'asc';

  isSubscribed(item: WorkshopEntry): boolean {
    return this.careerService.careers().some((c) => c.id === item.id);
  }

  unsubscribePlan(item: WorkshopEntry, event: Event): void {
    event.stopPropagation();
    this.careerService.removeCareer(item.id);
    this.toast.show(`Te has desuscrito del plan "${item.name}".`, 'info');
  }

  async ngOnInit(): Promise<void> {
    if (!this.firestore) return;
    try {
      const snap = await getDocs(collection(this.firestore, 'workshop_plans'));
      if (!snap.empty) {
        const remoteEntries: WorkshopEntry[] = snap.docs.map((dSnap) => {
          const data = dSnap.data();
          return {
            id: dSnap.id,
            name: data['name'] || dSnap.id,
            university: data['university'] || 'Universidad',
            faculty: data['faculty'] || 'Facultad',
            subscribersRange: data['subscribersRange'] || '10-50',
            version: data['version'] || '1.0.0',
            updatedAt: data['updatedAt'] || '2026-08-19',
            manifest: {
              id: dSnap.id,
              name: data['name'] || dSnap.id,
              university: data['university'],
              faculty: data['faculty'],
              version: data['version'],
              courses: data['courses'] || []
            }
          };
        });

        const remoteIds = new Set(remoteEntries.map(e => e.id));
        const nonDuplicateDefaults = DEFAULT_CATALOG.filter(e => !remoteIds.has(e.id));
        this.catalog = [...remoteEntries, ...nonDuplicateDefaults];
      }
    } catch {}
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
    if (this.searchQuery.trim()) {
      const q = normalizeString(this.searchQuery);
      list = list.filter(
        c =>
          normalizeString(c.name).includes(q) ||
          normalizeString(c.university).includes(q) ||
          normalizeString(c.faculty).includes(q)
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
    this.onSubscribe.emit(item.manifest);
    this.toast.show(`¡Suscrito al plan "${item.name}"!`, 'success');
    this.onClose.emit();
  }
}
