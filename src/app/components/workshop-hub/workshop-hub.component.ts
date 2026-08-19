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

const sampleWorkshopCatalog: WorkshopEntry[] = [
  {
    id: 'ing-sistemas',
    name: 'Ingeniería en Sistemas de Información',
    university: 'Universidad Tecnológica Nacional',
    faculty: 'Facultad Regional Buenos Aires',
    subscribersRange: '50-100',
    version: '2023',
    updatedAt: '2026-08-19',
    manifest: {
      id: 'ing-sistemas',
      name: 'Ingeniería en Sistemas de Información',
      university: 'Universidad Tecnológica Nacional',
      faculty: 'Facultad Regional Buenos Aires',
      version: '2023',
      courses: [
        { id: '1', name: 'Análisis Matemático I', year: 1, q: 3, cursarReq: [], aprobarReq: [] },
        { id: '2', name: 'Álgebra y Geometría Analítica', year: 1, q: 3, cursarReq: [], aprobarReq: [] },
      ],
    },
  },
];

@Component({
  selector: 'app-workshop-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose.emit()">
      <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-title">
            <span class="icon">🛒</span>
            <h3>Plan Hub Comunitario (Steam Workshop)</h3>
          </div>
          <button class="btn-close" (click)="onClose.emit()">✕</button>
        </header>

        <section class="modal-body">
          <div class="search-bar-row">
            <input
              type="text"
              class="search-input"
              placeholder="Buscar por universidad, carrera o facultad..."
              [(ngModel)]="searchQuery"
            />
          </div>

          <div class="catalog-list">
            <div *ngFor="let item of filteredCatalog" class="workshop-card">
              <div class="card-main">
                <div class="card-title-row">
                  <h4>{{ item.name }}</h4>
                  <span class="badge-subscribers">👥 {{ item.subscribersRange }} estudiantes</span>
                </div>
                <p class="university-info">🏫 {{ item.university }} — {{ item.faculty }}</p>
                <div class="version-info">
                  <span>Versión {{ item.version }}</span> • <span>Actualizado: {{ item.updatedAt }}</span>
                </div>
              </div>

              <div class="card-actions">
                <button class="btn btn-subscribe" (click)="subscribePlan(item)">
                  Suscribirse al Plan
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose.emit()">Cerrar</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 16px;
    }
    .glass-panel {
      background: #181825; border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      color: #cdd6f4; width: 100%; max-width: 720px; max-height: 85vh;
      display: flex; flex-direction: column;
    }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: space-between; align-items: center; }
    .header-title { display: flex; align-items: center; gap: 10px; }
    .header-title h3 { margin: 0; font-size: 1.15rem; color: #f5e0dc; }
    .btn-close { background: none; border: none; color: #a6adc8; font-size: 1.2rem; cursor: pointer; }
    .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
    .search-input {
      width: 100%; padding: 10px 14px; background: #11111b; border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px; color: #cdd6f4; font-size: 0.9rem; outline: none; box-sizing: border-box;
    }
    .search-input:focus { border-color: #89b4fa; }
    .catalog-list { display: flex; flex-direction: column; gap: 12px; }
    .workshop-card {
      background: #1e1e2e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px;
      padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;
    }
    .card-title-row { display: flex; align-items: center; gap: 12px; }
    .card-title-row h4 { margin: 0; font-size: 1.05rem; color: #cdd6f4; }
    .badge-subscribers { font-size: 0.72rem; padding: 2px 8px; background: rgba(137, 180, 250, 0.15); color: #89b4fa; border-radius: 10px; }
    .university-info { margin: 4px 0; font-size: 0.83rem; color: #a6adc8; }
    .version-info { font-size: 0.75rem; color: #6c7086; }
    .btn-subscribe { background: #89b4fa; color: #11111b; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .btn-subscribe:hover { opacity: 0.9; transform: translateY(-1px); }
    .modal-footer { padding: 16px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: flex-end; }
    .btn-secondary { background: #313244; color: #cdd6f4; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; }
  `]
})
export class WorkshopHubComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubscribe = new EventEmitter<PlanManifest>();

  private toast = inject(ToastService);
  private firestore = inject(Firestore, { optional: true });

  searchQuery = '';
  catalog: WorkshopEntry[] = sampleWorkshopCatalog;

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
