import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { RequisitesFlowComponent } from './requisites-flow.component';
import { CourseService } from '../../services/course.service';
import { CareerService } from '../../services/career.service';
import { Course } from '../../models/course';

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
];

class MockCourseService {
  private readonly _courses = signal<Course[]>(MOCK_COURSES);
  courses = this._courses.asReadonly();
  hasSelectedPlan = computed(() => true);

  getCourseById(id: number): Course | undefined {
    return this._courses().find((c) => c.id === id);
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

  it('should filter by status signal', () => {
    component.selectedStatus.set('approved');
    expect(component.selectedStatus()).toBe('approved');
  });
});
