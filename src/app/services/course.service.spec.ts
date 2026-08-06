import { TestBed } from '@angular/core/testing';
import { CourseService } from './course.service';

describe('CourseService - Lesson State Toggling', () => {
  let service: CourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseService);
  });

  describe('toggleLessonStatus', () => {
    it('should cycle lesson state from pending to coursing on first click', () => {
      const courses = service.courses();
      const firstLesson = courses[0]?.lessons[0];

      expect(firstLesson?.status).toBe('pending');

      service.toggleLessonStatus(firstLesson!.id);

      const updatedCourses = service.courses();
      const updatedLesson = updatedCourses[0]?.lessons[0];

      expect(updatedLesson?.status).toBe('coursing');
    });

    it('should cycle lesson state: pending → coursing → coursed → approved → pending', () => {
      const courses = service.courses();
      const firstLesson = courses[0]?.lessons[0];
      const lessonId = firstLesson!.id;

      // pending → coursing
      service.toggleLessonStatus(lessonId);
      let updated = service.courses()[0]?.lessons[0];
      expect(updated?.status).toBe('coursing');

      // coursing → coursed
      service.toggleLessonStatus(lessonId);
      updated = service.courses()[0]?.lessons[0];
      expect(updated?.status).toBe('coursed');

      // coursed → approved
      service.toggleLessonStatus(lessonId);
      updated = service.courses()[0]?.lessons[0];
      expect(updated?.status).toBe('approved');

      // approved → pending
      service.toggleLessonStatus(lessonId);
      updated = service.courses()[0]?.lessons[0];
      expect(updated?.status).toBe('pending');
    });

    it('should update only the clicked lesson, not other lessons in the same course', () => {
      const courses = service.courses();
      const course = courses[0];
      const lesson1 = course?.lessons[0];
      const lesson2 = course?.lessons[1];

      service.toggleLessonStatus(lesson1!.id);

      const updated = service.courses()[0];
      const updatedLesson1 = updated?.lessons[0];
      const updatedLesson2 = updated?.lessons[1];

      expect(updatedLesson1?.status).toBe('coursing');
      expect(updatedLesson2?.status).toBe('pending');
    });

    it('should update only the clicked lesson, not lessons in other courses', () => {
      const courses = service.courses();
      const lesson1FromCourse1 = courses[0]?.lessons[0];
      const lesson1FromCourse2 = courses[1]?.lessons[0];

      service.toggleLessonStatus(lesson1FromCourse1!.id);

      const updated = service.courses();
      expect(updated[0]?.lessons[0]?.status).toBe('coursing');
      expect(updated[1]?.lessons[0]?.status).toBe('pending');
    });

    it('should work on first click regardless of lesson order', () => {
      const courses = service.courses();

      // Get different lessons from the first course
      for (let i = 0; i < 3; i++) {
        const lesson = courses[0]?.lessons[i];
        if (lesson) {
          service.toggleLessonStatus(lesson.id);
          const updated = service.courses()[0]?.lessons[i];
          expect(updated?.status, `Lesson ${i} should change to coursing on first click`).toBe(
            'coursing',
          );

          // Reset for next iteration
          service.reset();
        }
      }
    });

    it('should handle multiple rapid clicks correctly', () => {
      const courses = service.courses();
      const lesson = courses[0]?.lessons[0];

      // Rapid clicks: pending -> coursing -> coursed -> approved
      service.toggleLessonStatus(lesson!.id);
      service.toggleLessonStatus(lesson!.id);
      service.toggleLessonStatus(lesson!.id);

      const updated = service.courses()[0]?.lessons[0];
      expect(updated?.status).toBe('approved');
    });

    it('should preserve lesson data other than status', () => {
      const courses = service.courses();
      const lesson = courses[0]?.lessons[0];
      const originalId = lesson?.id;
      const originalProfessor = lesson?.professor;
      const originalDay = lesson?.day;

      service.toggleLessonStatus(lesson!.id);

      const updated = service.courses()[0]?.lessons[0];
      expect(updated?.id).toBe(originalId);
      expect(updated?.professor).toBe(originalProfessor);
      expect(updated?.day).toBe(originalDay);
    });

    it('should work with lessons from different courses independently', () => {
      const courses = service.courses();
      const lesson1 = courses[0]?.lessons[0];
      const lesson2 = courses[1]?.lessons[0];
      const lesson3 = courses[2]?.lessons[0];

      service.toggleLessonStatus(lesson1!.id);
      service.toggleLessonStatus(lesson3!.id);

      const updated = service.courses();
      expect(updated[0]?.lessons[0]?.status).toBe('coursing');
      expect(updated[1]?.lessons[0]?.status).toBe('pending');
      expect(updated[2]?.lessons[0]?.status).toBe('coursing');
    });
  });

  describe('downstream prerequisite locking with numeric IDs', () => {
    it('should block demoting a prerequisite if an active dependent course requires its current state', () => {
      // Producción Audiovisual 1 (id: 1) & Producción Audiovisual 2 (id: 12)
      const pa1 = service.courses().find((c) => c.id === 1)!;
      const pa2 = service.courses().find((c) => c.id === 12)!;

      // Approve PA1 first
      service.toggleCourseStatus(pa1.id); // coursing
      service.toggleCourseStatus(pa1.id); // coursed
      service.toggleCourseStatus(pa1.id); // approved
      expect(service.getCourseById(pa1.id)?.status).toBe('approved');

      // Approve PA2
      service.toggleCourseStatus(pa2.id); // coursing
      service.toggleCourseStatus(pa2.id); // coursed
      service.toggleCourseStatus(pa2.id); // approved
      expect(service.getCourseById(pa2.id)?.status).toBe('approved');

      // Attempting to demote PA1 to pending while PA2 is approved must be blocked
      expect(service.canChangeStatusTo(pa1.id, 'pending')).toBe(false);

      // Resetting PA2 to pending releases the lock on PA1
      service.toggleCourseStatus(pa2.id); // resets PA2 to pending
      expect(service.getCourseById(pa2.id)?.status).toBe('pending');
      expect(service.canChangeStatusTo(pa1.id, 'pending')).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all lesson statuses to pending', () => {
      const courses = service.courses();
      const lesson1 = courses[0]?.lessons[0];
      const lesson2 = courses[1]?.lessons[0];

      service.toggleLessonStatus(lesson1!.id);
      service.toggleLessonStatus(lesson2!.id);
      service.toggleLessonStatus(lesson2!.id);

      service.reset();

      const reset = service.courses();
      expect(reset[0]?.lessons[0]?.status).toBe('pending');
      expect(reset[1]?.lessons[0]?.status).toBe('pending');
    });
  });

  describe('hover prerequisite and unlock visual sets with numeric IDs', () => {
    it('should calculate hoveredRequiredSet and hoveredUnlockedSet when hovering a course', () => {
      const pa1 = service.courses().find((c) => c.id === 1)!;
      const pa2 = service.courses().find((c) => c.id === 12)!;
      expect(pa1).toBeDefined();
      expect(pa2).toBeDefined();

      service.setHoveredCourseId(pa2.id);

      const reqSet = service.hoveredRequiredSet();
      const unlockSet = service.hoveredUnlockedSet();

      expect(reqSet.has(pa1.id)).toBe(true);

      // Clearing hover resets sets
      service.setHoveredCourseId(null);
      expect(service.hoveredRequiredSet().size).toBe(0);
      expect(service.hoveredUnlockedSet().size).toBe(0);
    });

    it('should correctly build unlockMap computed signal and return unlocked course IDs', () => {
      const pa1Id = 1; // Producción Audiovisual 1
      const pa2Id = 12; // Producción Audiovisual 2

      const unlockMap = service.unlockMap();
      expect(unlockMap).toBeDefined();
      expect(unlockMap.has(pa1Id)).toBe(true);

      const pa1Unlocks = unlockMap.get(pa1Id);
      expect(pa1Unlocks?.has(pa2Id)).toBe(true);

      const unlockedIds = service.getUnlockedCourseIds(pa1Id);
      expect(unlockedIds).toContain(pa2Id);
    });
  });

  describe('unified reactive state consolidation with numeric IDs', () => {
    it('should update course status and all lesson statuses atomically when toggleCourseStatus is called', () => {
      const course = service.courses()[0];
      expect(course.status).toBe('pending');
      expect(course.lessons.every((l) => l.status === 'pending')).toBe(true);

      service.toggleCourseStatus(course.id);

      const updatedCourse = service.getCourseById(course.id)!;
      expect(updatedCourse.status).toBe('coursing');
      expect(updatedCourse.lessons.every((l) => l.status === 'coursing')).toBe(true);
    });

    it('should sync course status when all lessons are toggled to the same status', () => {
      const course = service.courses()[0];
      course.lessons.forEach((lesson) => {
        service.toggleLessonStatus(lesson.id);
      });

      const updatedCourse = service.getCourseById(course.id)!;
      expect(updatedCourse.status).toBe('coursing');
      expect(updatedCourse.lessons.every((l) => l.status === 'coursing')).toBe(true);
    });

    it('should migrate legacy separate courseStatuses and lessonStatuses from localStorage cleanly using numeric IDs', () => {
      const legacyState = {
        courseStatuses: {
          'Producción Audiovisual 1': 'coursing',
        },
        lessonStatuses: {
          'PA1-L1': 'coursing',
          'PA1-L2': 'coursing',
        },
      };

      const mockStore: Record<string, string> = {
        'course-organizer-state': JSON.stringify(legacyState),
      };

      const mockLocalStorage = {
        getItem: (key: string) => mockStore[key] || null,
        setItem: (key: string, value: string) => {
          mockStore[key] = value;
        },
        clear: () => {},
        removeItem: () => {},
      };

      Object.defineProperty(globalThis, 'localStorage', {
        value: mockLocalStorage,
        configurable: true,
        writable: true,
      });

      // Re-create service instance to trigger loadState()
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(CourseService);
      const pa1 = newService.getCourseById(1);

      expect(pa1?.status).toBe('coursing');
      expect(pa1?.lessons[0].status).toBe('coursing');
    });
  });
});
