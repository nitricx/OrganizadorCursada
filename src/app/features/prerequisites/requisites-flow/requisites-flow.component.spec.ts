import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { RequisitesFlowComponent } from './requisites-flow.component';
import { CourseService } from '../../../services/course.service';
import { CareerService } from '../../../services/career.service';
import { Course } from '../../../models/course';

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    name: 'Materia 1',
    year: 1,
    q: 1,
    status: 'pending',
    cursarReqId: [],
    aprobarReqId: [],
    lessons: [],
  },
  {
    id: 2,
    name: 'Materia 2',
    year: 1,
    q: 2,
    status: 'pending',
    cursarReqId: [1],
    aprobarReqId: [],
    lessons: [],
  },
];

class MockCourseService {
  private readonly _courses = signal<Course[]>(MOCK_COURSES);
  courses = this._courses.asReadonly();
  hasSelectedPlan = computed(() => true);

  getCourseById(id: number): Course | undefined {
    return this._courses().find((c) => c.id === id);
  }

  areAllRequirementsMet(course: Course): boolean {
    return course.cursarReqId.length === 0;
  }
}

describe('RequisitesFlowComponent', () => {
  let component: RequisitesFlowComponent;
  let fixture: ComponentFixture<RequisitesFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequisitesFlowComponent],
      providers: [
        { provide: CourseService, useClass: MockCourseService },
        CareerService
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequisitesFlowComponent);
    component = fixture.componentInstance;
    const careerService = TestBed.inject(CareerService);
    careerService.selectCareer('lic-diseno-audiovisual');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize Cytoscape instance after view init', () => {
    expect(component.cy).not.toBeNull();
  });

  it('should assign available chip color for pending courses with met requirements', () => {
    const node1 = component.cy?.getElementById('1');
    const node2 = component.cy?.getElementById('2');

    expect(node1?.data('isAvailable')).toBe(true);
    expect(node1?.data('bg')).toBe('#e6f0fa');
    expect(node1?.data('statusLabel')).toBe('Disponible');

    expect(node2?.data('isAvailable')).toBe(false);
    expect(node2?.data('bg')).toBe('#e8e7e0');
    expect(node2?.data('statusLabel')).toBe('Pendiente');
  });

  it('should filter by available status signal', () => {
    component.onStatusSelectValueChange('available');
    expect(component.selectedStatus()).toBe('available');
  });
});

