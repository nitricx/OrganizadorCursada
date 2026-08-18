import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc, getDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

export interface UserCareerStateDoc {
  updatedAt?: string;
  coursesByPlan?: Record<string, any[]>;
  courseStates?: Record<string, any>;
  plans?: any[];
  semesterLists?: Record<string, any[]>;
  startingYears?: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class FirestoreSyncService {
  private firestore = inject(Firestore, { optional: true });

  private getDocRef(uid: string, careerId: string) {
    if (!this.firestore) return null;
    return doc(this.firestore, `users/${uid}/careers/${careerId}`);
  }

  getUserCareerData$(uid: string, careerId: string): Observable<UserCareerStateDoc | undefined> {
    const docRef = this.getDocRef(uid, careerId);
    if (!docRef) return of(undefined);
    return docData(docRef) as Observable<UserCareerStateDoc | undefined>;
  }

  async checkCloudDataExists(uid: string, careerId: string): Promise<boolean> {
    try {
      const docRef = this.getDocRef(uid, careerId);
      if (!docRef) return false;
      const snapshot = await getDoc(docRef);
      return snapshot.exists();
    } catch (err) {
      console.error('Error checking cloud data existence:', err);
      return false;
    }
  }

  async saveUserCareerData(uid: string, careerId: string, data: Partial<UserCareerStateDoc>): Promise<void> {
    try {
      const docRef = this.getDocRef(uid, careerId);
      if (!docRef) return;
      const payload: UserCareerStateDoc = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error('Error saving user data to Firestore:', err);
    }
  }
}
