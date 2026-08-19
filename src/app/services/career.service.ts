import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CareerIndexEntry, CareerPlan, RawCourseData, EMPTY_CAREER_PLAN } from '../models/career.model';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';

const DEFAULT_CAREER_INDEX: CareerIndexEntry[] = [
  {
    id: 'lic-diseno-audiovisual',
    name: 'Licenciatura en Diseño Audiovisual',
    university: 'Universidad Nacional de Río Negro',
  },
  {
    id: 'ing-sistemas',
    name: 'Ingeniería en Sistemas de Información',
    university: 'Universidad Tecnológica Nacional',
  },
];

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  private http = inject(HttpClient, { optional: true });
  private firestore = inject(Firestore, { optional: true });

  private static readonly SELECTED_CAREER_KEY = 'selected-career-id';
  private static readonly CUSTOM_CAREERS_INDEX_KEY = 'custom-careers-index';
  private static readonly CUSTOM_CAREER_PREFIX = 'custom-career-';

  private readonly careersSignal = signal<CareerIndexEntry[]>(this.loadInitialCareerIndex());
  private readonly selectedCareerIdSignal = signal<string>(this.loadSelectedCareerId());
  private readonly activeCareerSignal = signal<CareerPlan>(EMPTY_CAREER_PLAN);
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
    return this.safeGetItem(CareerService.SELECTED_CAREER_KEY) ?? '';
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
    return this.loadCustomIndex();
  }

  private async fetchRemoteIndex(): Promise<void> {
    if (!this.firestore) return;
    try {
      const snap = await getDocs(collection(this.firestore, 'workshop_plans'));
      if (!snap.empty) {
        const remoteEntries: CareerIndexEntry[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data['name'] || docSnap.id,
            university: data['university'] || 'Universidad',
          };
        });

        const custom = this.loadCustomIndex();
        const map = new Map<string, CareerIndexEntry>();
        remoteEntries.forEach((c) => map.set(c.id, c));
        custom.forEach((c) => map.set(c.id, c));
        this.careersSignal.set(Array.from(map.values()));
      }
    } catch {}
  }

  selectCareer(careerId: string): void {
    this.selectedCareerIdSignal.set(careerId);
    this.safeSetItem(CareerService.SELECTED_CAREER_KEY, careerId);
    this.loadCareerById(careerId);
  }

  async loadCareerById(careerId: string): Promise<void> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    if (!careerId) {
      this.activeCareerSignal.set(EMPTY_CAREER_PLAN);
      this.isLoadingSignal.set(false);
      return;
    }

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

    // 3. Check Firestore workshop_plans document
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'workshop_plans', careerId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const planData = snap.data() as CareerPlan;
          if (this.validateCareerPlan(planData)) {
            this.activeCareerSignal.set(planData);
            this.isLoadingSignal.set(false);
            return;
          }
        }
      } catch {}
    }

    // 4. Fallback if not found in Firestore or custom
    this.errorSignal.set('No se pudo cargar la carrera especificada.');
    this.isLoadingSignal.set(false);
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
        !isNaN(c.id) &&
        typeof c.name === 'string' &&
        c.name.trim() !== '' &&
        typeof c.year === 'number' &&
        !isNaN(c.year) &&
        typeof c.q === 'number' &&
        !isNaN(c.q) &&
        Array.isArray(c.cursarReqId) &&
        c.cursarReqId.every((id: any) => typeof id === 'number' && !isNaN(id)) &&
        Array.isArray(c.aprobarReqId) &&
        c.aprobarReqId.every((id: any) => typeof id === 'number' && !isNaN(id)) &&
        Array.isArray(c.lessons),
    );
  }
}
