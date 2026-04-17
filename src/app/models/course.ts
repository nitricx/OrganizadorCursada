export type CourseStatus = 'pending' | 'encurso' | 'approved';

export interface Course {
  id: string;
  name: string;
  year: number;
  q: number; // Quarter: 1, 2, or 3
  status: CourseStatus;
  cursarReq: string[]; // Requirements to take the course
  aprobarReq: string[]; // Requirements to approve the course
}
