import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { GoogleAuthProvider, User, signInWithPopup, signOut } from 'firebase/auth';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth, { optional: true });

  readonly userSignal = signal<User | null>(null);
  readonly loadingSignal = signal<boolean>(false);

  private authSubscription?: Subscription;

  constructor() {
    if (this.auth) {
      this.loadingSignal.set(true);
      this.authSubscription = user(this.auth)
        .pipe(takeUntilDestroyed())
        .subscribe({
          next: (userState) => {
            this.userSignal.set(userState);
            this.loadingSignal.set(false);
          },
          error: (err) => {
            console.error('Error listening to auth state changes:', err);
            this.loadingSignal.set(false);
          },
        });
    }
  }

  async loginWithGoogle(): Promise<User | null> {
    if (!this.auth) {
      console.warn('Firebase Auth is not provided.');
      return null;
    }
    try {
      this.loadingSignal.set(true);
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    if (!this.auth) return;
    try {
      this.loadingSignal.set(true);
      await signOut(this.auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
