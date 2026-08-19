import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { PlanService } from '../../services/plan.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let planService: PlanService;

  beforeEach(async () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage?.clear) {
        localStorage.clear();
      }
    } catch {}
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    planService = TestBed.inject(PlanService);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should render items computed from planService plans', () => {
    planService.addPlan({ id: '1', label: 'Plan de estudio 1' });
    fixture.detectChanges();
    const items = component.items();
    expect(items.length).toBe(5);
    const academicItem = items.find((i) => i.label === 'Calendario Académico');
    expect(academicItem).toBeDefined();
    expect(academicItem?.children?.length).toBe(1);
    expect(academicItem?.children?.[0].id).toBe('1');
  });

  it('should dynamically calculate next plan ID when addPlan is called', () => {
    planService.addPlan({ id: '1', label: 'Plan 1' });
    component.addPlan({ label: 'Calendario Académico' });

    const plans = planService.plans();
    expect(plans.length).toBe(2);
    expect(plans[1].id).toBe('2');

    // Add another plan
    component.addPlan({ label: 'Calendario Académico' });
    expect(planService.plans().length).toBe(3);
    expect(planService.plans()[2].id).toBe('3');
  });

  it('should handle non-numeric or deleted plan IDs gracefully when calculating next ID', () => {
    planService.addPlan({ id: '1', label: 'Plan 1' });
    // Delete plan 1 and add custom plan
    planService.deletePlan('1');
    planService.addPlan({ id: '10', label: 'Custom Plan 10' });

    component.addPlan({ label: 'Calendario Académico' });

    const plans = planService.plans();
    const lastPlan = plans[plans.length - 1];
    expect(lastPlan.id).toBe('11');
  });
});
