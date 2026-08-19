import { TestBed } from '@angular/core/testing';
import { PlanService, SemesterSlot } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;

  const safeGetItem = (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        return localStorage.getItem(key);
      }
    } catch {}
    return null;
  };

  beforeEach(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}
    TestBed.configureTestingModule({
      providers: [PlanService],
    });
    service = TestBed.inject(PlanService);
  });

  afterEach(() => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}
  });

  it('should initialize with clean canvas (empty plans) for new user', () => {
    const plans = service.plans();
    expect(plans.length).toBe(0);
  });

  it('should add a plan reactively', () => {
    service.addPlan({ id: '1', label: 'Plan de estudio 1' });
    const plans = service.plans();
    expect(plans.length).toBe(1);
    expect(plans.find((p) => p.id === '1')?.label).toBe('Plan de estudio 1');
  });

  it('should update plan label reactively', () => {
    service.addPlan({ id: '1', label: 'Plan Inicial' });
    service.updatePlanLabel('1', 'Plan Modificado');
    expect(service.getPlanLabel('1')).toBe('Plan Modificado');
  });

  it('should update and retrieve semester list reactively via Signals', () => {
    const mockSlots: SemesterSlot[] = [
      { id: 'Y1Q1', courseYear: 1, courseQ: 1, startDate: '01/04', endDate: '15/06' },
      { id: 'Y1Q2', courseYear: 1, courseQ: 2, startDate: '15/07', endDate: '30/11' },
    ];

    expect(service.getSemesterList('1')).toEqual([]);

    service.setSemesterList('1', mockSlots);

    // Verify signal state update
    expect(service.getSemesterList('1')).toEqual(mockSlots);
    expect(service.semesterLists().get('1')).toEqual(mockSlots);

    // Verify persistence in localStorage if available
    const rawStored = safeGetItem('plan-semesters-1');
    if (rawStored !== null) {
      expect(JSON.parse(rawStored)).toEqual(mockSlots);
    }
  });

  it('should update and retrieve starting year reactively via Signals', () => {
    const currentYear = new Date().getFullYear();
    expect(service.getStartingYear('1')).toBe(currentYear);

    service.setStartingYear('1', 2025);

    // Verify signal state update
    expect(service.getStartingYear('1')).toBe(2025);
    expect(service.startingYears().get('1')).toBe(2025);

    // Verify persistence in localStorage if available
    const rawStored = safeGetItem('plan-starting-year-1');
    if (rawStored !== null) {
      expect(rawStored).toBe('2025');
    }
  });

  it('should clean up semester list and starting year signals & localStorage when plan is deleted', () => {
    service.addPlan({ id: '2', label: 'Plan 2' });
    service.setSemesterList('2', [{ id: 'Y1Q1', courseYear: 1, courseQ: 1 }]);
    service.setStartingYear('2', 2024);

    expect(service.getSemesterList('2').length).toBe(1);
    expect(service.getStartingYear('2')).toBe(2024);

    service.deletePlan('2');

    expect(service.plans().find((p) => p.id === '2')).toBeUndefined();
    expect(service.getSemesterList('2')).toEqual([]);
    expect(service.semesterLists().get('2')).toBeUndefined();
    expect(service.startingYears().get('2')).toBeUndefined();
    expect(service.getStartingYear('2')).toBe(new Date().getFullYear());

    expect(safeGetItem('plan-semesters-2')).toBeNull();
    expect(safeGetItem('plan-starting-year-2')).toBeNull();
  });

  it('should reset state to new user', () => {
    service.addPlan({ id: '1', label: 'Plan 1' });
    expect(service.plans().length).toBe(1);

    service.resetToNewUser();
    expect(service.plans().length).toBe(0);
  });

  it('should compute default semester dates for Q1 and Q2', () => {
    const q1Dates = service.getDefaultSemesterDates(2026, 1);
    expect(q1Dates.startDate).toBeTruthy();
    expect(q1Dates.endDate).toBeTruthy();

    const q2Dates = service.getDefaultSemesterDates(2026, 2);
    expect(q2Dates.startDate).toBeTruthy();
    expect(q2Dates.endDate).toBeTruthy();
  });

  it('should recover gracefully from corrupted localStorage plans data', () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('plans', JSON.stringify([{ invalid: 'data' }, 'corrupted']));
      }
    } catch {}

    const newService = new PlanService();
    expect(newService.plans()).toEqual([]);
  });
});

