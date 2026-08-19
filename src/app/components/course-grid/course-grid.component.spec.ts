import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseGridComponent } from './course-grid.component';
import { Course } from '../../models/course';

describe('CourseGridComponent', () => {
  let component: CourseGridComponent;
  let fixture: ComponentFixture<CourseGridComponent>;

  const createMockCourses = (qValues: number[]): Course[] => {
    return qValues.map((q, index) => ({
      id: index + 1,
      name: `Materia ${index + 1}`,
      year: 1,
      q,
      status: 'pending',
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        {
          id: `M${index + 1}-L1`,
          professor: 'Prof. Test',
          day: 0,
          startTime: '08:00',
          endTime: '12:00',
        },
      ],
    }));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseGridComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('courses', []);
    fixture.componentRef.setInput('selectedIds', new Set<number>());
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should only render ANUAL header and NOT 1ER/2DO CUATRIMESTRE when all 8 subjects in a year are assigned to q=3', () => {
    // 8 subjects all assigned to annual (q=3)
    const annualCourses = createMockCourses([3, 3, 3, 3, 3, 3, 3, 3]);

    fixture.componentRef.setInput('courses', annualCourses);
    fixture.componentRef.setInput('selectedIds', new Set<number>());
    fixture.detectChanges();

    const qLabelElements = fixture.nativeElement.querySelectorAll('.q-label');
    const labels = Array.from(qLabelElements).map((el: any) => el.textContent?.trim());

    // Verify "Anual" is present
    expect(labels).toContain('Anual');

    // Verify "1er cuatrimestre" and "2do cuatrimestre" are NOT present on the screen
    expect(labels).not.toContain('1er cuatrimestre');
    expect(labels).not.toContain('2do cuatrimestre');
    expect(labels.length).toBe(1);
  });

  it('should render 1ER CUATRIMESTRE and 2DO CUATRIMESTRE headers when courses have q=1 and q=2', () => {
    const mixedCourses = createMockCourses([1, 1, 1, 2, 2, 2]);

    fixture.componentRef.setInput('courses', mixedCourses);
    fixture.componentRef.setInput('selectedIds', new Set<number>());
    fixture.detectChanges();

    const qLabelElements = fixture.nativeElement.querySelectorAll('.q-label');
    const labels = Array.from(qLabelElements).map((el: any) => el.textContent?.trim());

    expect(labels).toContain('1er cuatrimestre');
    expect(labels).toContain('2do cuatrimestre');
    expect(labels).not.toContain('Anual');
  });

  it('should render ANUAL, 1ER CUATRIMESTRE and 2DO CUATRIMESTRE when courses span all three quarters', () => {
    const allQuarterCourses = createMockCourses([3, 1, 2]);

    fixture.componentRef.setInput('courses', allQuarterCourses);
    fixture.componentRef.setInput('selectedIds', new Set<number>());
    fixture.detectChanges();

    const qLabelElements = fixture.nativeElement.querySelectorAll('.q-label');
    const labels = Array.from(qLabelElements).map((el: any) => el.textContent?.trim());

    expect(labels).toContain('Anual');
    expect(labels).toContain('1er cuatrimestre');
    expect(labels).toContain('2do cuatrimestre');
    expect(labels.length).toBe(3);
  });
});
