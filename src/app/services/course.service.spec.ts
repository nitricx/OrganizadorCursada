import { TestBed } from '@angular/core/testing';
import { CourseService } from './course.service';
import { CareerPlan } from '../models/career.model';

const TEST_CAREER_PLAN: CareerPlan = {
  id: 'lic-diseno-audiovisual',
  name: 'Carrera de Prueba',
  courses: [
    {
      id: 1,
      name: 'Producción Audiovisual 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'PA1-L1', professor: 'Prof. A', day: 0, startTime: '08:00', endTime: '12:00' },
        { id: 'PA1-L2', professor: 'Prof. A', day: 1, startTime: '13:00', endTime: '17:00' },
      ],
    },
    {
      id: 2,
      name: 'Escritura Audiovisual 1',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'EA1-L1', professor: 'Prof. B', day: 1, startTime: '08:00', endTime: '12:00' },
      ],
    },
    {
      id: 3,
      name: 'Software en Edición',
      year: 1,
      q: 1,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'SEA-L1', professor: 'Prof. C', day: 2, startTime: '08:00', endTime: '12:00' },
      ],
    },
    {
      id: 4,
      name: 'Iluminación y Cámara 1',
      year: 1,
      q: 2,
      cursarReqId: [],
      aprobarReqId: [],
      lessons: [
        { id: 'IyC1-L1', professor: 'Prof. D', day: 3, startTime: '08:00', endTime: '12:00' },
      ],
    },
    {
      id: 12,
      name: 'Producción Audiovisual 2',
      year: 2,
      q: 1,
      cursarReqId: [1],
      aprobarReqId: [1],
      lessons: [
        { id: 'PA2-L1', professor: 'Prof. A', day: 1, startTime: '08:00', endTime: '12:00' },
      ],
    },
  ],
};

describe('CourseService - Lesson State Toggling', () => {
  let service: CourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseService);
    service.setCareerPlan(TEST_CAREER_PLAN);
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

    it('should reset subjects of the active career plan instead of reverting to default career', () => {
      const mockSistemasPlan: CareerPlan = {
        id: 'ing-sistemas',
        name: 'Ingeniería en Sistemas de Información',
        courses: [
          {
            id: 1,
            name: 'Análisis Matemático I',
            year: 1,
            q: 1,
            cursarReqId: [],
            aprobarReqId: [],
            lessons: [{ id: 'L1', professor: 'Prof. X', day: 1, startTime: '08:00', endTime: '12:00' }],
          },
        ],
      };

      service.setCareerPlan(mockSistemasPlan);
      expect(service.courses().length).toBe(mockSistemasPlan.courses.length);
      expect(service.courses()[0].name).toBe(mockSistemasPlan.courses[0].name);

      // Change status of first course
      const firstCourseId = service.courses()[0].id;
      service.toggleCourseStatus(firstCourseId);
      expect(service.courses()[0].status).not.toBe('pending');

      // Perform reset
      service.reset();

      // Courses should still belong to mockSistemasPlan and be reset to pending
      expect(service.courses().length).toBe(mockSistemasPlan.courses.length);
      expect(service.courses()[0].status).toBe('pending');
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

  describe('unified reactive state consolidation with numeric IDs and commission selection', () => {
    it('should update course status and set only the selected lesson to coursing when toggleCourseStatus is called', () => {
      const course = service.courses()[0];
      expect(course.status).toBe('pending');
      expect(course.lessons.every((l) => l.status === 'pending')).toBe(true);

      service.toggleCourseStatus(course.id);

      const updatedCourse = service.getCourseById(course.id)!;
      expect(updatedCourse.status).toBe('coursing');
      expect(updatedCourse.selectedLessonId).toBe(course.lessons[0].id);

      const selectedLesson = updatedCourse.lessons.find((l) => l.id === updatedCourse.selectedLessonId);
      expect(selectedLesson?.status).toBe('coursing');

      if (updatedCourse.lessons.length > 1) {
        const unselectedLessons = updatedCourse.lessons.filter((l) => l.id !== updatedCourse.selectedLessonId);
        expect(unselectedLessons.every((l) => l.status === 'pending')).toBe(true);
      }
    });

    it('should allow setting a specific selected lesson via setSelectedLessonForCourse', () => {
      const course = service.courses().find((c) => c.lessons.length > 1) ?? service.courses()[0];
      const secondLessonId = course.lessons[1]?.id ?? course.lessons[0].id;

      service.setSelectedLessonForCourse(course.id, secondLessonId);

      const updatedCourse = service.getCourseById(course.id)!;
      expect(updatedCourse.selectedLessonId).toBe(secondLessonId);
      expect(service.getSelectedLessonId(course.id)).toBe(secondLessonId);
    });

    it('should set course status to coursing when a single lesson is toggled to coursing', () => {
      const course = service.courses()[0];
      const targetLesson = course.lessons[0];

      service.toggleLessonStatus(targetLesson.id);

      const updatedCourse = service.getCourseById(course.id)!;
      expect(updatedCourse.status).toBe('coursing');
      expect(updatedCourse.selectedLessonId).toBe(targetLesson.id);
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
        'course-organizer-state-test-career': JSON.stringify(legacyState),
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
      newService.setCareerPlan(TEST_CAREER_PLAN);
      (newService as any).loadState(TEST_CAREER_PLAN);
      const pa1 = newService.getCourseById(1);

      expect(pa1?.status).toBe('coursing');
      expect(pa1?.lessons[0].status).toBe('coursing');
    });

    it('should sanitize corrupted localStorage courseStates data without failing', () => {
      const corruptedState = {
        courseStates: {
          '1': { status: 'invalid_status', lessonStatuses: { 'PA1-L1': 'bad_status' } },
          'not_a_number': { status: 'approved' },
          '12': null,
        },
      };

      const mockStore: Record<string, string> = {
        'course-organizer-state': JSON.stringify(corruptedState),
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

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(CourseService);
      newService.setCareerPlan(TEST_CAREER_PLAN);
      const pa1 = newService.getCourseById(1);
      const pa2 = newService.getCourseById(12);

      expect(pa1?.status).toBe('pending');
      expect(pa2?.status).toBe('pending');
    });
  });

  describe('Legend Status Filtering', () => {
    it('should start with no disabled status filters', () => {
      expect(service.disabledStatusFilters().size).toBe(0);
    });

    it('should toggle status filters correctly', () => {
      service.toggleStatusFilter('approved');
      expect(service.disabledStatusFilters().has('approved')).toBe(true);

      service.toggleStatusFilter('approved');
      expect(service.disabledStatusFilters().has('approved')).toBe(false);
    });

    it('should correctly identify filtered courses by status key', () => {
      const course = service.getCourseById(1)!;
      // Initially not filtered
      expect(service.isCourseFiltered(course)).toBe(false);

      // Course 1 has no requirements met, so its status key for pending is 'available'
      service.toggleStatusFilter('available');
      expect(service.isCourseFiltered(course)).toBe(true);

      service.toggleStatusFilter('available');
      expect(service.isCourseFiltered(course)).toBe(false);
    });
  });
});


