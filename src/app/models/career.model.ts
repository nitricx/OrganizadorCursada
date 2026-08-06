import { Course } from './course';

export interface CareerIndexEntry {
  id: string;
  name: string;
  university?: string;
  file?: string;
}

export interface RawCourseData {
  id: number;
  name: string;
  year: number;
  q: number;
  cursarReqId: number[];
  aprobarReqId: number[];
  lessons: {
    id: string;
    professor: string;
    day: number;
    startTime: string;
    endTime: string;
  }[];
}

export interface CareerPlan {
  id: string;
  name: string;
  university?: string;
  version?: string;
  courses: RawCourseData[];
}
