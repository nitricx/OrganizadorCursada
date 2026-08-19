import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize userSignal to null and loadingSignal to false when Auth is not provided', () => {
    expect(service.userSignal()).toBeNull();
    expect(service.loadingSignal()).toBe(false);
  });

  it('should return null on loginWithGoogle when Auth is not provided', async () => {
    const result = await service.loginWithGoogle();
    expect(result).toBeNull();
  });

  it('should resolve gracefully on logout when Auth is not provided', async () => {
    await service.logout();
    expect(service.loadingSignal()).toBe(false);
  });
});
