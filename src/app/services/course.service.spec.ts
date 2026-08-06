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
});
