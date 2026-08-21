import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Course } from '../models/course';
import { CourseStateEntry } from './course.service';
import { Plan, SemesterSlot } from './plan.service';
import { environment } from '../../environments/environment';

export interface UserCareerStateDoc {
  updatedAt?: string;
  coursesByPlan?: Record<string, Course[]>;
  courseStates?: Record<string, CourseStateEntry>;
  plans?: Plan[];
  semesterLists?: Record<string, SemesterSlot[]>;
  startingYears?: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class AwsSyncService {
  private http = inject(HttpClient, { optional: true });
  private apiEndpoint = environment.aws?.apiEndpoint;

  getUserCareerData$(uid: string, careerId: string): Observable<UserCareerStateDoc | undefined> {
    if (!this.http || !this.apiEndpoint || this.apiEndpoint.includes('example.com')) {
      return of(undefined);
    }
    const url = `${this.apiEndpoint}/users/${uid}/careers/${careerId}`;
    return this.http.get<UserCareerStateDoc>(url).pipe(
      catchError((err) => {
        console.warn('AWS API get user career data warning:', err);
        return of(undefined);
      })
    );
  }

  async checkCloudDataExists(uid: string, careerId: string): Promise<boolean> {
    if (!this.http || !this.apiEndpoint || this.apiEndpoint.includes('example.com')) {
      return false;
    }
    try {
      const url = `${this.apiEndpoint}/users/${uid}/careers/${careerId}`;
      const data = await this.http.get<UserCareerStateDoc>(url).toPromise();
      return !!data;
    } catch (err) {
      console.warn('Error checking AWS cloud data existence:', err);
      return false;
    }
  }

  async saveUserCareerData(uid: string, careerId: string, data: Partial<UserCareerStateDoc>): Promise<boolean> {
    if (!this.http || !this.apiEndpoint || this.apiEndpoint.includes('example.com')) {
      return false;
    }
    try {
      const url = `${this.apiEndpoint}/users/${uid}/careers/${careerId}`;
      const payload: UserCareerStateDoc = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await this.http.put(url, payload).toPromise();
      return true;
    } catch (err) {
      console.error('Error saving user data to AWS API:', err);
      return false;
    }
  }
}
