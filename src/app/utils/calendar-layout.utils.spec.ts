import { Course, DayOfWeek, Lesson } from '../models/course';
import {
  timeToMinutes,
  lessonsOverlap,
  getMaxConcurrentLessons,
  assignSubColumnsForDay,
  computeCourseColumnMap,
  computeMaxConcurrentPerDay,
  computeMaxConcurrentCourses,
  computeOverlappingCourseIds,
  calculateStartHour,
  calculateEndHour,
  generateTimeSlots,
  generateGridTemplateColumns,
  generateGridTemplateRows,
  calculateHourLineEnd,
  timeToRow,
  getCourseColumnSpan,
  getCourseRowSpan,
  CourseWithLesson,
} from './calendar-layout.utils';

describe('CalendarLayoutUtils', () => {
  const dummyCourse: Course = {
    id: 1,
    name: 'Course Test',
    year: 1,
    q: 1,
    cursarReqId: [],
    aprobarReqId: [],
    status: 'coursing',
    lessons: [],
  };

  const lesson1: Lesson = {
    id: 'L1',
    professor: 'Prof A',
    day: DayOfWeek.Monday,
    startTime: '08:00',
    endTime: '10:00',
    status: 'coursing',
  };

  const lesson2Overlapping: Lesson = {
    id: 'L2',
    professor: 'Prof B',
    day: DayOfWeek.Monday,
    startTime: '09:00',
    endTime: '11:00',
    status: 'coursing',
  };

  const lesson3NonOverlapping: Lesson = {
    id: 'L3',
    professor: 'Prof C',
    day: DayOfWeek.Monday,
    startTime: '11:00',
    endTime: '13:00',
    status: 'coursing',
  };

  const cwl1: CourseWithLesson = { course: dummyCourse, lesson: lesson1 };
  const cwl2: CourseWithLesson = { course: dummyCourse, lesson: lesson2Overlapping };
  const cwl3: CourseWithLesson = { course: dummyCourse, lesson: lesson3NonOverlapping };

  describe('timeToMinutes', () => {
    it('should convert HH:MM to minutes correctly', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('08:30')).toBe(510);
      expect(timeToMinutes('18:45')).toBe(1125);
    });
  });

  describe('lessonsOverlap', () => {
    it('should return true for overlapping time slots', () => {
      expect(lessonsOverlap(cwl1, cwl2)).toBe(true);
    });

    it('should return false for adjacent non-overlapping time slots', () => {
      expect(lessonsOverlap(cwl2, cwl3)).toBe(false);
    });

    it('should return false for completely distinct time slots', () => {
      expect(lessonsOverlap(cwl1, cwl3)).toBe(false);
    });
  });

  describe('getMaxConcurrentLessons', () => {
    it('should return 1 for empty list', () => {
      expect(getMaxConcurrentLessons([])).toBe(1);
    });

    it('should return 1 when no lessons overlap', () => {
      expect(getMaxConcurrentLessons([cwl1, cwl3])).toBe(1);
    });

    it('should return 2 when 2 lessons overlap', () => {
      expect(getMaxConcurrentLessons([cwl1, cwl2, cwl3])).toBe(2);
    });
  });

  describe('assignSubColumnsForDay', () => {
    it('should assign sub-columns correctly for overlapping lessons', () => {
      const subCols = assignSubColumnsForDay([cwl1, cwl2, cwl3]);
      expect(subCols.get('L1')).toBe(0);
      expect(subCols.get('L2')).toBe(1);
      expect(subCols.get('L3')).toBe(0);
    });
  });

  describe('computeCourseColumnMap and computeMaxConcurrentPerDay', () => {
    it('should compute maps across days', () => {
      const coursesByDay = new Map<DayOfWeek, CourseWithLesson[]>();
      coursesByDay.set(DayOfWeek.Monday, [cwl1, cwl2]);
      coursesByDay.set(DayOfWeek.Tuesday, [cwl3]);

      const colMap = computeCourseColumnMap(coursesByDay);
      expect(colMap.get('L1')).toBe(0);
      expect(colMap.get('L2')).toBe(1);

      const maxPerDay = computeMaxConcurrentPerDay(coursesByDay);
      expect(maxPerDay.get(DayOfWeek.Monday)).toBe(2);
      expect(maxPerDay.get(DayOfWeek.Tuesday)).toBe(1);

      expect(computeMaxConcurrentCourses(coursesByDay)).toBe(2);
    });
  });

  describe('computeOverlappingCourseIds', () => {
    it('should identify overlapping lesson IDs', () => {
      const coursesByDay = new Map<DayOfWeek, CourseWithLesson[]>();
      coursesByDay.set(DayOfWeek.Monday, [cwl1, cwl2, cwl3]);

      const overlapping = computeOverlappingCourseIds(coursesByDay);
      expect(overlapping.has('L1')).toBe(true);
      expect(overlapping.has('L2')).toBe(true);
      expect(overlapping.has('L3')).toBe(false);
    });
  });

  describe('calculateStartHour and calculateEndHour', () => {
    it('should return default 8 and 18 for empty course list', () => {
      expect(calculateStartHour([], false)).toBe(8);
      expect(calculateEndHour([], false)).toBe(18);
    });

    it('should return earliest hour minus 1 and latest hour plus 1', () => {
      const course: Course = {
        ...dummyCourse,
        lessons: [
          { ...lesson1, startTime: '09:00', endTime: '11:00' },
          { ...lesson2Overlapping, startTime: '14:00', endTime: '16:00' },
        ],
      };
      expect(calculateStartHour([course], false)).toBe(8);
      expect(calculateEndHour([course], false)).toBe(17);
    });

    it('should respect readOnly status filter', () => {
      const course: Course = {
        ...dummyCourse,
        lessons: [
          { ...lesson1, startTime: '07:00', endTime: '09:00', status: 'pending' },
          { ...lesson2Overlapping, startTime: '10:00', endTime: '12:00', status: 'coursing' },
        ],
      };
      expect(calculateStartHour([course], true)).toBe(9);
      expect(calculateEndHour([course], true)).toBe(13);
    });
  });

  describe('generateTimeSlots and CSS layout functions', () => {
    it('should generate time slots with labels on even steps', () => {
      const slots = generateTimeSlots(8, 10);
      expect(slots).toHaveLength(2);
      expect(slots[0]).toEqual({ label: '08:00', row: 2 });
      expect(slots[1]).toEqual({ label: '', row: 4 });
    });

    it('should generate gridTemplateColumns format', () => {
      expect(generateGridTemplateColumns(5, 2)).toBe('44px repeat(2, 1fr) repeat(2, 1fr) repeat(2, 1fr) repeat(2, 1fr) repeat(2, 1fr)');
    });

    it('should generate gridTemplateRows format', () => {
      expect(generateGridTemplateRows(8, 12)).toBe('36px repeat(7, 15px)');
    });

    it('should calculate hour line end', () => {
      expect(calculateHourLineEnd(5, 2)).toBe(12);
    });

    it('should calculate timeToRow', () => {
      expect(timeToRow('08:00', 8)).toBe(2);
      expect(timeToRow('09:30', 8)).toBe(5);
    });
  });

  describe('getCourseColumnSpan and getCourseRowSpan', () => {
    it('should span full day width if no overlap', () => {
      const colMap = new Map<string, number>();
      expect(getCourseColumnSpan('L1', 0, 2, colMap, false)).toBe('2 / span 2');
      expect(getCourseColumnSpan('L1', 1, 2, colMap, false)).toBe('4 / span 2');
    });

    it('should span 1 sub-column if overlapping', () => {
      const colMap = new Map<string, number>([['L2', 1]]);
      expect(getCourseColumnSpan('L2', 0, 2, colMap, true)).toBe('3 / span 1');
    });

    it('should generate row span string', () => {
      expect(getCourseRowSpan('08:00', '10:00', 8)).toBe('2 / 6');
    });
  });
});
