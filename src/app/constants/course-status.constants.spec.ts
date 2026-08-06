import {
  COURSE_STATUS_CONFIG,
  COURSE_STATUS_LIST,
  getCourseStatusConfig,
  getCourseStatusLabel,
  getCourseStatusTag,
} from './course-status.constants';
import { CourseStatus } from '../models/course';

describe('CourseStatusConstants', () => {
  it('should contain configuration for all four statuses', () => {
    expect(COURSE_STATUS_LIST.length).toBe(4);
    expect(COURSE_STATUS_CONFIG.pending.label).toBe('Pendiente');
    expect(COURSE_STATUS_CONFIG.coursing.label).toBe('Cursando');
    expect(COURSE_STATUS_CONFIG.coursed.label).toBe('Cursada');
    expect(COURSE_STATUS_CONFIG.approved.label).toBe('Aprobada');
  });

  it('should return correct config, label, and tag for given status', () => {
    const statuses: CourseStatus[] = ['pending', 'coursing', 'coursed', 'approved'];

    for (const status of statuses) {
      const config = getCourseStatusConfig(status);
      expect(config.key).toBe(status);
      expect(getCourseStatusLabel(status)).toBe(config.label);
      expect(getCourseStatusTag(status)).toBe(config.tag);
    }
  });

  it('should fallback to pending if status is invalid', () => {
    const fallback = getCourseStatusConfig('unknown' as CourseStatus);
    expect(fallback.key).toBe('pending');
    expect(fallback.label).toBe('Pendiente');
  });
});
