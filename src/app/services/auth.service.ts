import { Injectable, signal } from '@angular/core';
import {
  signInWithRedirect,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  AuthUser,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly userSignal = signal<AppUser | null>(null);
  readonly loadingSignal = signal<boolean>(false);

  constructor() {
    this.initAuth();
  }

  private initAuth(): void {
    void this.checkCurrentUser();
    this.listenToAuthEvents();
  }

  private async checkCurrentUser(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const authUser: AuthUser = await getCurrentUser();
      const attributes = (await fetchUserAttributes().catch(() => ({}))) as Record<string, string | undefined>;
      this.userSignal.set({
        uid: authUser.userId || authUser.username,
        email: attributes['email'] || authUser.signInDetails?.loginId || null,
        displayName: attributes['name'] || attributes['nickname'] || authUser.username || null,
        photoURL: attributes['picture'] || null,
      });
    } catch {
      this.userSignal.set(null);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private listenToAuthEvents(): void {
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          this.checkCurrentUser();
          break;
        case 'signedOut':
          this.userSignal.set(null);
          break;
        case 'signInWithRedirect_failure':
          console.error('AWS Cognito Google Sign In Failure:', payload.data);
          this.userSignal.set(null);
          break;
      }
    });
  }

  async loginWithGoogle(): Promise<AppUser | null> {
    try {
      this.loadingSignal.set(true);
      await signInWithRedirect({ provider: 'Google' });
      return this.userSignal();
    } catch (error) {
      console.error('Error initiating Google sign-in with AWS Cognito:', error);
      this.loadingSignal.set(false);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.loadingSignal.set(true);
      await signOut();
      this.userSignal.set(null);
    } catch (error) {
      console.error('Error signing out of AWS Cognito:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
