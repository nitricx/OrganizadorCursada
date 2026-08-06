import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonSelectorModalComponent } from './lesson-selector-modal.component';
import { Course, DayOfWeek } from '../../models/course';

describe('LessonSelectorModalComponent', () => {
  let component: LessonSelectorModalComponent;
  let fixture: ComponentFixture<LessonSelectorModalComponent>;

  const mockCourse: Course = {
    id: 1,
    name: 'Producción Audiovisual 1',
    year: 1,
    q: 1,
    status: 'pending',
    cursarReqId: [],
    aprobarReqId: [],
    selectedLessonId: 'PA1-L1',
    lessons: [
      {
        id: 'PA1-L1',
        professor: 'Profesor Alpha',
        day: DayOfWeek.Monday,
        startTime: '18:00',
        endTime: '22:00',
        status: 'pending',
      },
      {
        id: 'PA1-L2',
        professor: 'Profesor Beta',
        day: DayOfWeek.Tuesday,
        startTime: '08:00',
        endTime: '12:00',
        status: 'pending',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonSelectorModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonSelectorModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should resolve day names correctly', () => {
    expect(component.getDayName(DayOfWeek.Monday)).toBe('Lunes');
    expect(component.getDayName(DayOfWeek.Tuesday)).toBe('Martes');
    expect(component.getDayName(DayOfWeek.Wednesday)).toBe('Miércoles');
  });

  it('should emit lessonSelected on confirmSelection', () => {
    fixture.componentRef.setInput('course', mockCourse);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    let selectedResult: { courseId: number; lessonId: string } | null = null;
    component.lessonSelected.subscribe((res) => {
      selectedResult = res;
    });

    component.selectLesson('PA1-L2');
    component.confirmSelection();

    expect(selectedResult).toEqual({ courseId: 1, lessonId: 'PA1-L2' });
  });

  it('should emit closed when closeModal is called', () => {
    let closedFired = false;
    component.closed.subscribe(() => {
      closedFired = true;
    });

    component.closeModal();

    expect(closedFired).toBe(true);
  });
});
