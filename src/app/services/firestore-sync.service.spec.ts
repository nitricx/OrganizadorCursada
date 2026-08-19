import { TestBed } from '@angular/core/testing';
import { FirestoreSyncService } from './firestore-sync.service';
import { firstValueFrom } from 'rxjs';

describe('FirestoreSyncService', () => {
  let service: FirestoreSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return undefined Observable from getUserCareerData$ when Firestore is not provided', async () => {
    const data = await firstValueFrom(service.getUserCareerData$('user-123', 'career-456'));
    expect(data).toBeUndefined();
  });

  it('should return false on checkCloudDataExists when Firestore is not provided', async () => {
    const exists = await service.checkCloudDataExists('user-123', 'career-456');
    expect(exists).toBe(false);
  });

  it('should return false on saveUserCareerData when Firestore is not provided', async () => {
    const success = await service.saveUserCareerData('user-123', 'career-456', {});
    expect(success).toBe(false);
  });
});
