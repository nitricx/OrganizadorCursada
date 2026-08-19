import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CareerIndexEntry, CareerPlan, RawCourseData } from '../models/career.model';
import {
  DEFAULT_AUDIOVISUAL_PLAN,
  DEFAULT_SISTEMAS_PLAN,
} from '../data/courses.data';

const DEFAULT_CAREER_INDEX: CareerIndexEntry[] = [
  {
    id: 'lic-diseno-audiovisual',
    name: 'Licenciatura en Diseño Audiovisual',
    university: 'Universidad Nacional de Río Negro',
    file: 'audiovisual.json',
  },
  {
    id: 'ing-sistemas',
    name: 'Ingeniería en Sistemas de Información',
    university: 'Universidad Tecnológica Nacional',
    file: 'sistemas.json',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  private http = inject(HttpClient, { optional: true });

  private static readonly SELECTED_CAREER_KEY = 'selected-career-id';
  private static readonly CUSTOM_CAREERS_INDEX_KEY = 'custom-careers-index';
  private static readonly CUSTOM_CAREER_PREFIX = 'custom-career-';

  private readonly careersSignal = signal<CareerIndexEntry[]>(this.loadInitialCareerIndex());
  private readonly selectedCareerIdSignal = signal<string>(this.loadSelectedCareerId());
  private readonly activeCareerSignal = signal<CareerPlan>(DEFAULT_AUDIOVISUAL_PLAN);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  private readonly customPlansMapSignal = signal<Map<string, CareerPlan>>(new Map());

  careers = this.careersSignal.asReadonly();
  selectedCareerId = this.selectedCareerIdSignal.asReadonly();
  activeCareer = this.activeCareerSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  constructor() {
    this.fetchRemoteIndex();
    this.loadCareerById(this.selectedCareerIdSignal());
  }

  private safeGetItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {}
    return null;
  }

  private safeSetItem(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {}
  }

  private loadSelectedCareerId(): string {
    return this.safeGetItem(CareerService.SELECTED_CAREER_KEY) ?? 'lic-diseno-audiovisual';
  }

  private loadCustomIndex(): CareerIndexEntry[] {
    const raw = this.safeGetItem(CareerService.CUSTOM_CAREERS_INDEX_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadInitialCareerIndex(): CareerIndexEntry[] {
    const custom = this.loadCustomIndex();
    const map = new Map<string, CareerIndexEntry>();
    DEFAULT_CAREER_INDEX.forEach((c) => map.set(c.id, c));
    custom.forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }

  private fetchRemoteIndex(): void {
    if (!this.http) return;
    this.http.get<CareerIndexEntry[]>('/careers/careers.json').subscribe({
      next: (remoteIndex) => {
        if (Array.isArray(remoteIndex)) {
          const custom = this.loadCustomIndex();
          const map = new Map<string, CareerIndexEntry>();
          remoteIndex.forEach((c) => map.set(c.id, c));
          custom.forEach((c) => map.set(c.id, c));
          this.careersSignal.set(Array.from(map.values()));
        }
      },
      error: () => {
        // Keep initial index if remote fetch fails
      },
    });
  }

  selectCareer(careerId: string): void {
    this.selectedCareerIdSignal.set(careerId);
    this.safeSetItem(CareerService.SELECTED_CAREER_KEY, careerId);
    this.loadCareerById(careerId);
  }

  loadCareerById(careerId: string): void {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    // 1. Check in-memory custom imported plans
    const memoryPlan = this.customPlansMapSignal().get(careerId);
    if (memoryPlan) {
      this.activeCareerSignal.set(memoryPlan);
      this.isLoadingSignal.set(false);
      return;
    }

    // 2. Check custom user imported careers in localStorage
    const customRaw = this.safeGetItem(`${CareerService.CUSTOM_CAREER_PREFIX}${careerId}`);
    if (customRaw) {
      try {
        const parsed: CareerPlan = JSON.parse(customRaw);
        if (this.validateCareerPlan(parsed)) {
          this.customPlansMapSignal.update((m) => new Map(m).set(careerId, parsed));
          this.activeCareerSignal.set(parsed);
          this.isLoadingSignal.set(false);
          return;
        }
      } catch {}
    }

    // 3. Default hardcoded fallbacks for built-in careers
    if (careerId === 'lic-diseno-audiovisual') {
      this.activeCareerSignal.set(DEFAULT_AUDIOVISUAL_PLAN);
      this.isLoadingSignal.set(false);
      return;
    }
    if (careerId === 'ing-sistemas') {
      this.activeCareerSignal.set(DEFAULT_SISTEMAS_PLAN);
      this.isLoadingSignal.set(false);
      return;
    }

    // 4. Attempt HTTP fetch for remote career file
    const indexEntry = this.careersSignal().find((c) => c.id === careerId);
    const fileName = indexEntry?.file ?? (careerId === 'ing-sistemas' ? 'sistemas.json' : 'audiovisual.json');

    if (this.http) {
      this.http.get<CareerPlan>(`/careers/${fileName}`).subscribe({
        next: (plan) => {
          if (this.validateCareerPlan(plan)) {
            this.activeCareerSignal.set(plan);
          } else if (careerId !== 'lic-diseno-audiovisual' && careerId !== 'ing-sistemas') {
            this.errorSignal.set('El plan de estudio recibido no es válido.');
          }
          this.isLoadingSignal.set(false);
        },
        error: (err) => {
          if (careerId !== 'lic-diseno-audiovisual' && careerId !== 'ing-sistemas') {
            this.errorSignal.set(`No se pudo cargar la carrera (${err.statusText || 'Error de red'})`);
          }
          this.isLoadingSignal.set(false);
        },
      });
    } else {
      this.isLoadingSignal.set(false);
    }
  }

  importCareerFromJson(jsonString: string): { success: boolean; error?: string; careerId?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!this.validateCareerPlan(parsed)) {
        return {
          success: false,
          error: 'Formato de JSON inválido. Debe contener "id", "name" y un arreglo "courses" válido.',
        };
      }

      const plan: CareerPlan = parsed;
      this.customPlansMapSignal.update((map) => new Map(map).set(plan.id, plan));

      const customKey = `${CareerService.CUSTOM_CAREER_PREFIX}${plan.id}`;
      this.safeSetItem(customKey, JSON.stringify(plan));

      const newEntry: CareerIndexEntry = {
        id: plan.id,
        name: plan.name,
        university: plan.university ?? 'Personalizada',
      };


      const customIndex = this.loadCustomIndex();
      const updatedCustom = [...customIndex.filter((c) => c.id !== plan.id), newEntry];
      this.safeSetItem(CareerService.CUSTOM_CAREERS_INDEX_KEY, JSON.stringify(updatedCustom));

      const updatedAll = [...this.careersSignal().filter((c) => c.id !== plan.id), newEntry];
      this.careersSignal.set(updatedAll);

      this.selectCareer(plan.id);

      return { success: true, careerId: plan.id };
    } catch (err: any) {
      return { success: false, error: `Error al procesar el archivo JSON: ${err?.message || 'Sintaxis errónea'}` };
    }
  }

  validateCareerPlan(data: any): data is CareerPlan {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.id !== 'string' || !data.id.trim()) return false;
    if (typeof data.name !== 'string' || !data.name.trim()) return false;
    if (!Array.isArray(data.courses)) return false;

    return data.courses.every(
      (c: any) =>
        typeof c.id === 'number' &&
        typeof c.name === 'string' &&
        typeof c.year === 'number' &&
        typeof c.q === 'number' &&
        Array.isArray(c.cursarReqId) &&
        Array.isArray(c.aprobarReqId) &&
        Array.isArray(c.lessons),
    );
  }
}
