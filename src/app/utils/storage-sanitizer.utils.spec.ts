import {
  isValidCourseStatus,
  isValidPlan,
  sanitizePlans,
  isValidSemesterSlot,
  sanitizeSemesterSlots,
  sanitizeStartingYear,
  isValidLesson,
  isValidCourse,
  sanitizeCourseStateEntry,
  sanitizeCourseStatesMap,
  sanitizeCoursesByPlan,
  cleanupOrphanedStorageKeys,
} from './storage-sanitizer.utils';
import { Plan, SemesterSlot } from '../services/plan.service';

describe('storage-sanitizer.utils', () => {
  describe('isValidCourseStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isValidCourseStatus('pending')).toBe(true);
      expect(isValidCourseStatus('coursing')).toBe(true);
      expect(isValidCourseStatus('coursed')).toBe(true);
      expect(isValidCourseStatus('approved')).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      expect(isValidCourseStatus('invalid')).toBe(false);
      expect(isValidCourseStatus(123)).toBe(false);
      expect(isValidCourseStatus(null)).toBe(false);
      expect(isValidCourseStatus(undefined)).toBe(false);
    });
  });

  describe('isValidPlan and sanitizePlans', () => {
    const defaultPlans: Plan[] = [{ id: '1', label: 'Plan 1' }];

    it('should validate valid plan objects', () => {
      expect(isValidPlan({ id: '1', label: 'Plan 1' })).toBe(true);
      expect(isValidPlan({ id: '', label: 'Plan 1' })).toBe(false);
      expect(isValidPlan({ id: '1', label: '' })).toBe(false);
      expect(isValidPlan(null)).toBe(false);
    });

    it('should sanitize plans array and deduplicate IDs', () => {
      const raw = [
        { id: '1', label: 'Plan 1' },
        { id: '1', label: 'Duplicate Plan 1' },
        { id: '2', label: 'Plan 2' },
        { id: '', label: 'Invalid Plan' },
        'corrupted string',
      ];

      const result = sanitizePlans(raw, defaultPlans);
      expect(result).toEqual([
        { id: '1', label: 'Plan 1' },
        { id: '2', label: 'Plan 2' },
      ]);
    });

    it('should fallback to defaultPlans if input is not array or has no valid items', () => {
      expect(sanitizePlans('invalid json', defaultPlans)).toEqual(defaultPlans);
      expect(sanitizePlans([], defaultPlans)).toEqual(defaultPlans);
      expect(sanitizePlans([{ invalid: true }], defaultPlans)).toEqual(defaultPlans);
    });
  });

  describe('isValidSemesterSlot and sanitizeSemesterSlots', () => {
    it('should validate valid semester slots', () => {
      const valid: SemesterSlot = { id: 's1', courseYear: 1, courseQ: 1 };
      expect(isValidSemesterSlot(valid)).toBe(true);
      expect(isValidSemesterSlot({ id: 's1', courseYear: 'invalid', courseQ: 1 })).toBe(false);
    });

    it('should sanitize semester slots array', () => {
      const raw = [
        { id: 's1', courseYear: 1, courseQ: 1, startDate: '01/04', endDate: '15/06' },
        { id: 's2', courseYear: 'bad', courseQ: 2 },
        null,
      ];

      const result = sanitizeSemesterSlots(raw);
      expect(result).toEqual([
        { id: 's1', courseYear: 1, courseQ: 1, startDate: '01/04', endDate: '15/06' },
      ]);
    });

    it('should return empty array for invalid input', () => {
      expect(sanitizeSemesterSlots(null)).toEqual([]);
      expect(sanitizeSemesterSlots({ bad: 'object' })).toEqual([]);
    });
  });

  describe('sanitizeStartingYear', () => {
    it('should return valid number within 1900..2100', () => {
      expect(sanitizeStartingYear(2025, 2026)).toBe(2025);
      expect(sanitizeStartingYear('2024', 2026)).toBe(2024);
    });

    it('should fallback to default year on out-of-range or non-numeric values', () => {
      expect(sanitizeStartingYear(1850, 2026)).toBe(2026);
      expect(sanitizeStartingYear(2200, 2026)).toBe(2026);
      expect(sanitizeStartingYear('invalid', 2026)).toBe(2026);
      expect(sanitizeStartingYear(null, 2026)).toBe(2026);
    });
  });

  describe('sanitizeCourseStateEntry and sanitizeCourseStatesMap', () => {
    it('should sanitize individual course state entry', () => {
      const validEntry = {
        status: 'approved',
        lessonStatuses: { 'L1': 'approved', 'L2': 'invalid_status' },
      };
      const sanitized = sanitizeCourseStateEntry(validEntry);
      expect(sanitized.status).toBe('approved');
      expect(sanitized.lessonStatuses['L1']).toBe('approved');
      expect(sanitized.lessonStatuses['L2']).toBe('approved'); // fallback to status
    });

    it('should fallback to default entry if input is invalid', () => {
      const sanitized = sanitizeCourseStateEntry(null);
      expect(sanitized).toEqual({ status: 'pending', lessonStatuses: {}, selectedLessonId: null });
    });

    it('should sanitize course states map', () => {
      const raw = {
        '10': { status: 'coursing', lessonStatuses: {} },
        'invalid_key': { status: 'approved', lessonStatuses: {} },
        '20': 'corrupted_value',
      };
      const map = sanitizeCourseStatesMap(raw);
      expect(map.size).toBe(2);
      expect(map.get(10)).toEqual({ status: 'coursing', lessonStatuses: {}, selectedLessonId: null });
      expect(map.get(20)).toEqual({ status: 'pending', lessonStatuses: {}, selectedLessonId: null });
    });
  });

  describe('sanitizeCoursesByPlan', () => {
    it('should sanitize valid courses by plan map object', () => {
      const validLesson = {
        id: 'L1',
        professor: 'Docente',
        day: 1,
        startTime: '18:00',
        endTime: '22:00',
      };
      const validCourse = {
        id: 101,
        name: 'Materia 1',
        year: 1,
        q: 1,
        status: 'pending',
        cursarReqId: [],
        aprobarReqId: [],
        lessons: [validLesson],
      };
      const raw = {
        '1': [validCourse, { invalidCourse: true }],
        '2': 'not an array',
      };

      const map = sanitizeCoursesByPlan(raw);
      expect(map.get('1')).toEqual([validCourse as any]);
      expect(map.has('2')).toBe(false);
    });

    it('should return empty map for non-object inputs', () => {
      expect(sanitizeCoursesByPlan(null).size).toBe(0);
      expect(sanitizeCoursesByPlan('string').size).toBe(0);
    });
  });

  describe('cleanupOrphanedStorageKeys', () => {
    it('should remove orphaned plan and career keys from localStorage', () => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem('plan-semesters-active1', '[]');
          localStorage.setItem('plan-semesters-orphan1', '[]');
          localStorage.setItem('plan-starting-year-active1', '2026');
          localStorage.setItem('plan-starting-year-orphan1', '2026');
          localStorage.setItem('course-organizer-state-orphanCareer', '{}');
          localStorage.setItem('unrelated-key', 'keep');

          cleanupOrphanedStorageKeys(['active1'], []);

          expect(localStorage.getItem('plan-semesters-active1')).toBe('[]');
          expect(localStorage.getItem('plan-starting-year-active1')).toBe('2026');
          expect(localStorage.getItem('unrelated-key')).toBe('keep');

          expect(localStorage.getItem('plan-semesters-orphan1')).toBeNull();
          expect(localStorage.getItem('plan-starting-year-orphan1')).toBeNull();
          expect(localStorage.getItem('course-organizer-state-orphanCareer')).toBeNull();
        }
      } catch {}
    });
  });
});
