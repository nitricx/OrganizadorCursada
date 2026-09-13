import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AwsSyncService } from './aws-sync.service';

describe('AwsSyncService', () => {
  let service: AwsSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AwsSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return of(undefined) for mock/example endpoints gracefully', async () => {
    const res = await firstValueFrom(service.getUserCareerData$('user-123', 'career-456'));
    expect(res).toBeUndefined();
  });

  it('should return false for checkCloudDataExists on mock/example endpoints', async () => {
    const exists = await service.checkCloudDataExists('user-123', 'career-456');
    expect(exists).toBe(false);
  });
});
