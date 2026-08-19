import { Component, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanManifest } from '../../models/plan-manifest.model';
import { ToastService } from '../../services/toast.service';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

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

import { CareerService } from '../../services/career.service';

@Component({
  selector: 'app-workshop-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workshop-hub.component.html',
  styleUrl: './workshop-hub.component.css'
})
export class WorkshopHubComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubscribe = new EventEmitter<PlanManifest>();

  private toast = inject(ToastService);
  private firestore = inject(Firestore, { optional: true });
  private careerService = inject(CareerService);

  searchQuery = '';
  catalog: WorkshopEntry[] = [];

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
        this.catalog = remoteEntries;
      }
    } catch {}
  }

  get filteredCatalog(): WorkshopEntry[] {
    if (!this.searchQuery.trim()) return this.catalog;
    const q = this.searchQuery.toLowerCase();
    return this.catalog.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.university.toLowerCase().includes(q) ||
      c.faculty.toLowerCase().includes(q)
    );
  }

  subscribePlan(item: WorkshopEntry): void {
    this.onSubscribe.emit(item.manifest);
    this.toast.show(`¡Suscrito al plan "${item.name}"!`, 'success');
    this.onClose.emit();
  }
}
