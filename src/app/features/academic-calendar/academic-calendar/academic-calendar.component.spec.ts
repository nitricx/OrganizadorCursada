import { NO_ERRORS_SCHEMA, signal, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AcademicCalendarComponent } from './academic-calendar.component';
import { CourseService } from '../../../services/course.service';
import { ToastService } from '../../../services/toast.service';
import { Course, DayOfWeek } from '../../../models/course';

// Two courses with no year=2 so the inserted semester pair at year=2 starts empty
const MOCK_Y1Q1: Course = {
  id: 101,
  name: 'Course 1',
  year: 1,
  q: 1,
  status: 'pending',
  cursarReqId: [],
  aprobarReqId: [],
  lessons: [
    {
      id: 'C1-L1',
      professor: 'Prof A',
      day: DayOfWeek.Monday,
      startTime: '08:00',
      endTime: '12:00',
    },
  ],
};

const MOCK_Y3Q1: Course = {
  id: 103,
  name: 'Course 3',
  year: 3,
  q: 1,
  status: 'pending',
  cursarReqId: [],
  aprobarReqId: [],
  lessons: [
    {
      id: 'C3-L1',
      professor: 'Prof B',
      day: DayOfWeek.Tuesday,
      startTime: '08:00',
      endTime: '12:00',
    },
  ],
};

class MockCourseService {
  private readonly _courses = signal<Course[]>([MOCK_Y1Q1, MOCK_Y3Q1]);

  courses = this._courses.asReadonly();
  selectedIds = computed(() => new Set<number>());
  hoveredCourseId = computed(() => null as number | null);
  hasSelectedPlan = computed(() => true);

  // Controls returned by tests
  blockReason: string | null = null;

  setCurrentPlanId(_id: string): void {}

  deletePlan(_planId: string): void {}

  getCoursesForPlan(_planId: string): Course[] {
    return this._courses();
  }

  areAllRequirementsMet(_course: Course): boolean {
    return true;
  }

  moveLessonToSemester(lessonId: string, targetYear: number, targetQ: number): void {
    const courses = this._courses();
    for (const course of courses) {
      if (course.lessons.some((l) => l.id === lessonId)) {
        const movedCourse: Course = {
          ...course,
          year: targetYear,
          q: targetQ,
        };
        const updated = courses.filter((c) => c.id !== course.id).concat(movedCourse);
        this._courses.set(updated);
        return;
      }
    }
  }

  getMoveBlockReason(_lessonId: string, _targetYear: number): string | null {
    return this.blockReason;
  }

  canMoveLessonToSemester(lessonId: string, targetYear: number): boolean {
    return this.getMoveBlockReason(lessonId, targetYear) === null;
  }
}

describe('AcademicCalendarComponent – semester insertion and course movement', () => {
  let component: AcademicCalendarComponent;
  let fixture: ComponentFixture<AcademicCalendarComponent>;

  beforeEach(async () => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }

    await TestBed.configureTestingModule({
      imports: [AcademicCalendarComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'test-plan' })) },
        },
        { provide: CourseService, useClass: MockCourseService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AcademicCalendarComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AcademicCalendarComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    if (typeof localStorage !== 'undefined' && localStorage.clear) {
      localStorage.clear();
    }
  });

  it('should start with 4 display semesters derived from year=1 and year=3 courses', () => {
    const semesters = component.displaySemesters();
    expect(semesters.length).toBe(4);
    expect(semesters[0]).toEqual(expect.objectContaining({ courseYear: 1, q: 1 }));
    expect(semesters[1]).toEqual(expect.objectContaining({ courseYear: 1, q: 2 }));
    expect(semesters[2]).toEqual(expect.objectContaining({ courseYear: 3, q: 1 }));
    expect(semesters[3]).toEqual(expect.objectContaining({ courseYear: 3, q: 2 }));
  });

  it('should insert a semester pair between year=1 and year=3, and show the moved subject alone in the new q=1 slot', () => {
    // The Y1Q2 slot is at index 1; insert after it to create new slots between year=1 and year=3
    const y1q2SlotId = component.displaySemesters()[1].id;
    component.addCalendarAfter(y1q2SlotId);
    fixture.detectChanges();

    const afterInsert = component.displaySemesters();
    expect(afterInsert.length).toBe(6);

    // The newly created pair should be at positions 2 and 3 (display labels)
    const newQ1 = afterInsert[2];
    const newQ2 = afterInsert[3];
    expect(newQ1).toEqual(expect.objectContaining({ q: 1 }));
    expect(newQ2).toEqual(expect.objectContaining({ q: 2 }));

    // New slots have unique virtual courseYears (>=1000), so no real courses appear in them yet
    expect(newQ1.courseYear).toBeGreaterThanOrEqual(1000);
    expect(newQ1.courses.length).toBe(0);
    expect(newQ2.courses.length).toBe(0);

    // The original year=3 slots (now at positions 4 and 5) are unaffected
    expect(afterInsert[4]).toEqual(expect.objectContaining({ courseYear: 3, q: 1 }));
    expect(afterInsert[4].courses.length).toBe(1); // MOCK_Y3Q1 still there

    // Move the year=1,q=1 course's lesson to the newly inserted q=1 slot
    component.onLessonMoveRequested(
      { lessonId: 'C1-L1', direction: 'next', courseYear: 1, courseQ: 1 },
      0, // display index of the Y1Q1 slot
    );
    fixture.detectChanges();

    const afterMove = component.displaySemesters();

    // The new q=1 slot contains exactly the moved course
    expect(afterMove[2].courses.length).toBe(1);
    expect(afterMove[2].courses[0].name).toBe('Course 1');

    // The new q=2 slot remains empty
    expect(afterMove[3].courses.length).toBe(0);

    // The original y=3 q=1 slot is unaffected — Course 1 does NOT appear there
    const y3q1Slot = afterMove.find((s) => s.courseYear === 3 && s.q === 1);
    expect(y3q1Slot?.courses.every((c) => c.name !== 'Course 1')).toBe(true);
  });

  describe('toast notification', () => {
    let mockService: MockCourseService;
    let toastService: ToastService;

    beforeEach(() => {
      mockService = TestBed.inject(CourseService) as unknown as MockCourseService;
      toastService = TestBed.inject(ToastService);
      mockService.blockReason = null;
      vi.spyOn(toastService, 'warning');
    });

    it('should not show a toast when the move is allowed', () => {
      mockService.blockReason = null;

      component.onLessonMoveRequested(
        { lessonId: 'C1-L1', direction: 'next', courseYear: 1, courseQ: 1 },
        0,
      );
      fixture.detectChanges();

      expect(toastService.warning).not.toHaveBeenCalled();
      expect(toastService.toasts().length).toBe(0);
    });

    it('should call ToastService.warning with block reason when move is blocked', () => {
      mockService.blockReason =
        'No se puede mover "Course 1" porque "Course 2" la requiere y está en el mismo año';

      component.onLessonMoveRequested(
        { lessonId: 'C1-L1', direction: 'next', courseYear: 1, courseQ: 1 },
        0,
      );
      fixture.detectChanges();

      expect(toastService.warning).toHaveBeenCalledWith(mockService.blockReason);
      expect(toastService.toasts().length).toBe(1);
      expect(toastService.toasts()[0].message).toBe(mockService.blockReason);
    });

    it('should not move the lesson when the move is blocked', () => {
      mockService.blockReason = 'blocked';
      const semestersBefore = component.displaySemesters().map((s) => s.courses.length);

      component.onLessonMoveRequested(
        { lessonId: 'C1-L1', direction: 'next', courseYear: 1, courseQ: 1 },
        0,
      );
      fixture.detectChanges();

      const semestersAfter = component.displaySemesters().map((s) => s.courses.length);
      expect(semestersAfter).toEqual(semestersBefore);
    });

    it('should initialize default semester slots when course list is empty without entering infinite loop', () => {
      mockService.getCoursesForPlan = () => [];
      fixture = TestBed.createComponent(AcademicCalendarComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const displaySemesters = component.displaySemesters();
      expect(displaySemesters.length).toBeGreaterThan(0);
      expect(component.hasSelectedPlan()).toBe(true);
    });
  });
});
