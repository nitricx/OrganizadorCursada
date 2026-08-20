import { Injectable, inject, signal, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CareerIndexEntry, CareerPlan, RawCourseData, EMPTY_CAREER_PLAN } from '../models/career.model';
import { Firestore, collection, getDocs, doc, getDoc } from '@angular/fire/firestore';

import sistemasPlan from '../../../scripts/seed-data/sistemas.json';
import audiovisualPlan from '../../../scripts/seed-data/audiovisual.json';

import { PlanService } from './plan.service';

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  private http = inject(HttpClient, { optional: true });
  private firestore = inject(Firestore, { optional: true });
  private injector = inject(Injector, { optional: true });

  private getPlanService(): PlanService | null {
    try {
      return this.injector?.get(PlanService, null) ?? null;
    } catch {
      return null;
    }
  }

  private static readonly SELECTED_CAREER_KEY = 'selected-career-id';
  private static readonly CUSTOM_CAREERS_INDEX_KEY = 'custom-careers-index';
  private static readonly CUSTOM_CAREER_PREFIX = 'custom-career-';
  private static readonly REMOVED_CAREERS_KEY = 'removed-career-ids';

  private readonly careersSignal = signal<CareerIndexEntry[]>(this.loadInitialCareerIndex());
  private readonly selectedCareerIdSignal = signal<string>(this.loadSelectedCareerId());
  private readonly activeCareerSignal = signal<CareerPlan>(this.loadInitialCareerPlan());
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
    const currentId = this.selectedCareerIdSignal();
    if (currentId) {
      this.loadCareerById(currentId);
    }
  }

  private loadInitialCareerPlan(): CareerPlan {
    const selectedId = this.loadSelectedCareerId();
    if (!selectedId) return EMPTY_CAREER_PLAN;

    const customRaw = this.safeGetItem(`${CareerService.CUSTOM_CAREER_PREFIX}${selectedId}`);
    if (customRaw) {
      try {
        const parsed = JSON.parse(customRaw);
        if (this.validateCareerPlan(parsed)) {
          return parsed;
        }
      } catch {}
    }

    if (selectedId === 'lic-diseno-audiovisual') {
      return audiovisualPlan as unknown as CareerPlan;
    }
    if (selectedId === 'ing-sistemas') {
      return sistemasPlan as unknown as CareerPlan;
    }

    return EMPTY_CAREER_PLAN;
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

  private safeRemoveItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.removeItem(key);
      }
    } catch {}
  }

  private loadRemovedCareerIds(): string[] {
    const raw = this.safeGetItem(CareerService.REMOVED_CAREERS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private markCareerAsRemoved(careerId: string): void {
    const removed = this.loadRemovedCareerIds();
    if (!removed.includes(careerId)) {
      removed.push(careerId);
      this.safeSetItem(CareerService.REMOVED_CAREERS_KEY, JSON.stringify(removed));
    }
  }

  private unmarkCareerAsRemoved(careerId: string): void {
    const removed = this.loadRemovedCareerIds().filter((id) => id !== careerId);
    this.safeSetItem(CareerService.REMOVED_CAREERS_KEY, JSON.stringify(removed));
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
    const removed = new Set(this.loadRemovedCareerIds());
    const custom = this.loadCustomIndex();
    return custom.filter((c) => !removed.has(c.id));
  }

  private async fetchRemoteIndex(): Promise<void> {
    const removed = new Set(this.loadRemovedCareerIds());
    const map = new Map<string, CareerIndexEntry>();
    
    const custom = this.loadCustomIndex();
    custom.forEach((c) => {
      if (!removed.has(c.id)) map.set(c.id, c);
    });

    this.careersSignal.set(Array.from(map.values()));
  }

  selectCareer(careerId: string): void {
    this.selectedCareerIdSignal.set(careerId);
    this.safeSetItem(CareerService.SELECTED_CAREER_KEY, careerId);
    this.loadCareerById(careerId);
  }

  removeCareer(careerId: string): void {
    if (!careerId) return;

    this.markCareerAsRemoved(careerId);

    this.customPlansMapSignal.update((m) => {
      const next = new Map(m);
      next.delete(careerId);
      return next;
    });

    const customIndex = this.loadCustomIndex().filter((c) => c.id !== careerId);
    this.safeSetItem(CareerService.CUSTOM_CAREERS_INDEX_KEY, JSON.stringify(customIndex));

    this.safeRemoveItem(`${CareerService.CUSTOM_CAREER_PREFIX}${careerId}`);
    this.safeRemoveItem(`course-organizer-state-${careerId}`);

    const updatedCareers = this.careersSignal().filter((c) => c.id !== careerId);
    this.careersSignal.set(updatedCareers);

    const planService = this.getPlanService();
    if (planService) {
      planService.deletePlan(careerId);
    }

    if (this.selectedCareerIdSignal() === careerId) {
      if (updatedCareers.length > 0) {
        this.selectCareer(updatedCareers[0].id);
      } else {
        this.selectedCareerIdSignal.set('');
        this.safeRemoveItem(CareerService.SELECTED_CAREER_KEY);
        this.activeCareerSignal.set(EMPTY_CAREER_PLAN);
      }
    }
  }

  addCareerFromManifest(manifest: any): string {
    if (!manifest) return '';

    const planId = manifest.id || `custom-plan-${Date.now()}`;
    const name = manifest.name || 'Plan de estudio';
    const university = manifest.university || 'Universidad';

    const rawCourses: RawCourseData[] = (manifest.courses || []).map((c: any, index: number) => {
      const numericId = typeof c.id === 'number' ? c.id : (parseInt(c.id, 10) || index + 1);

      let cursarReqId: number[] = Array.isArray(c.cursarReqId) ? c.cursarReqId : [];
      if (!cursarReqId.length && Array.isArray(c.cursarReq)) {
        cursarReqId = c.cursarReq.map((reqStr: string) => {
          const match = manifest.courses.find((other: any) => other.name === reqStr || String(other.id) === reqStr);
          return match ? (typeof match.id === 'number' ? match.id : (parseInt(match.id, 10) || null)) : null;
        }).filter((id: any) => id !== null && !isNaN(id));
      }

      let aprobarReqId: number[] = Array.isArray(c.aprobarReqId) ? c.aprobarReqId : [];
      if (!aprobarReqId.length && Array.isArray(c.aprobarReq)) {
        aprobarReqId = c.aprobarReq.map((reqStr: string) => {
          const match = manifest.courses.find((other: any) => other.name === reqStr || String(other.id) === reqStr);
          return match ? (typeof match.id === 'number' ? match.id : (parseInt(match.id, 10) || null)) : null;
        }).filter((id: any) => id !== null && !isNaN(id));
      }

      return {
        id: numericId,
        name: c.name,
        year: c.year || 1,
        q: c.q || 3,
        cursarReqId,
        aprobarReqId,
        lessons: Array.isArray(c.lessons) ? c.lessons : []
      };
    });

    const careerPlan: CareerPlan = {
      id: planId,
      name,
      university,
      version: manifest.version || '1.0.0',
      courses: rawCourses
    };

    this.unmarkCareerAsRemoved(planId);
    this.customPlansMapSignal.update((m) => new Map(m).set(planId, careerPlan));
    const customKey = `${CareerService.CUSTOM_CAREER_PREFIX}${planId}`;
    this.safeSetItem(customKey, JSON.stringify(careerPlan));

    const newEntry: CareerIndexEntry = {
      id: planId,
      name,
      university
    };

    const customIndex = this.loadCustomIndex();
    const updatedCustom = [...customIndex.filter((c) => c.id !== planId), newEntry];
    this.safeSetItem(CareerService.CUSTOM_CAREERS_INDEX_KEY, JSON.stringify(updatedCustom));

    const updatedAll = [...this.careersSignal().filter((c) => c.id !== planId), newEntry];
    this.careersSignal.set(updatedAll);

    this.selectCareer(planId);
    return planId;
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

    // 3. Fallback for built-in demo careers
    if (careerId === 'lic-diseno-audiovisual') {
      this.activeCareerSignal.set(audiovisualPlan as unknown as CareerPlan);
      this.isLoadingSignal.set(false);
      return;
    }
    if (careerId === 'ing-sistemas') {
      this.activeCareerSignal.set(sistemasPlan as unknown as CareerPlan);
      this.isLoadingSignal.set(false);
      return;
    }

    // 4. Check Firestore workshop_plans document
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'workshop_plans', careerId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const planData = snap.data() as CareerPlan;
          if (this.validateCareerPlan(planData)) {
            // Cache to localStorage for offline access
            const customKey = `${CareerService.CUSTOM_CAREER_PREFIX}${careerId}`;
            this.safeSetItem(customKey, JSON.stringify(planData));
            this.customPlansMapSignal.update((m) => new Map(m).set(careerId, planData));

            this.activeCareerSignal.set(planData);
            this.isLoadingSignal.set(false);
            return;
          }
        }
      } catch {}
    }

    // 5. Fallback if not found in Firestore or custom
    this.errorSignal.set('No se pudo cargar la carrera especificada.');
    this.isLoadingSignal.set(false);
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
