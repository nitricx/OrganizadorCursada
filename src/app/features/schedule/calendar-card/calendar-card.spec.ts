import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarCard } from './calendar-card';
import { Course, DayOfWeek } from '../../../models/course';
import { CourseService } from '../../../services/course.service';

class MockCourseService {
  toggleLessonStatus = vi.fn();
}

const MOCK_COURSE: Course = {
  id: 101,
  name: 'Matemática 1',
  year: 1,
  q: 1,
  status: 'pending',
  cursarReqId: [],
  aprobarReqId: [],
  lessons: [
    {
      id: 'MAT1-L1',
      professor: 'Prof. Gauss',
      day: DayOfWeek.Monday,
      startTime: '08:00',
      endTime: '10:00',
    },
  ],
};

describe('CalendarCard', () => {
  let component: CalendarCard;
  let fixture: ComponentFixture<CalendarCard>;
  let mockCourseService: MockCourseService;

  beforeEach(async () => {
    mockCourseService = new MockCourseService();

    await TestBed.configureTestingModule({
      imports: [CalendarCard],
      providers: [{ provide: CourseService, useValue: mockCourseService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarCard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('course', MOCK_COURSE);
    fixture.componentRef.setInput('lesson', MOCK_COURSE.lessons[0]);
    fixture.componentRef.setInput('isEditable', true);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set tabindex 0 and aria-label when isEditable is true', () => {
    const cardEl: HTMLElement = fixture.nativeElement;
    expect(cardEl.getAttribute('tabindex')).toBe('0');
    expect(cardEl.getAttribute('aria-label')).toContain('Matemática 1');
    expect(cardEl.getAttribute('aria-label')).toContain('Alt + Flecha');
  });

  it('should emit lessonMoveRequested with direction next when Alt+ArrowDown is pressed', () => {
    const moveSpy = vi.fn();
    component.lessonMoveRequested.subscribe(moveSpy);

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      altKey: true,
      bubbles: true,
    });
    fixture.nativeElement.dispatchEvent(event);

    expect(moveSpy).toHaveBeenCalledWith({
      lessonId: 'MAT1-L1',
      direction: 'next',
      courseYear: 1,
      courseQ: 1,
    });
  });

  it('should emit lessonMoveRequested with direction prev when Alt+ArrowUp is pressed', () => {
    const moveSpy = vi.fn();
    component.lessonMoveRequested.subscribe(moveSpy);

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      altKey: true,
      bubbles: true,
    });
    fixture.nativeElement.dispatchEvent(event);

    expect(moveSpy).toHaveBeenCalledWith({
      lessonId: 'MAT1-L1',
      direction: 'prev',
      courseYear: 1,
      courseQ: 1,
    });
  });

  it('should toggle lesson status on click if not read only and clickTogglesStatus is true', () => {
    fixture.nativeElement.click();
    expect(mockCourseService.toggleLessonStatus).toHaveBeenCalledWith('MAT1-L1');
  });

  it('should configure vertical overflow scrolling on host element', () => {
    const cardEl: HTMLElement = fixture.nativeElement;
    const style = window.getComputedStyle(cardEl);
    expect(style.overflowY).toBe('auto');
    expect(style.overflowX).toBe('hidden');
  });
});
