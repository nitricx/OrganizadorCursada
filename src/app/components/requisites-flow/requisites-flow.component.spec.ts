import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RequisitesFlowComponent } from './requisites-flow.component';
import { CourseService } from '../../services/course.service';

describe('RequisitesFlowComponent', () => {
  let component: RequisitesFlowComponent;
  let fixture: ComponentFixture<RequisitesFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequisitesFlowComponent],
      providers: [CourseService],
    }).compileComponents();

    fixture = TestBed.createComponent(RequisitesFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Cytoscape instance after view init', () => {
    expect(component.cy).not.toBeNull();
  });

  it('should filter by year signal', () => {
    component.selectedYear.set('1');
    expect(component.selectedYear()).toBe('1');
  });

  it('should filter by status signal', () => {
    component.selectedStatus.set('approved');
    expect(component.selectedStatus()).toBe('approved');
  });
});
