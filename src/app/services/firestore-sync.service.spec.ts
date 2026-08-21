import { TestBed } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AwsSyncService } from './aws-sync.service';

describe('AwsSyncService', () => {
  let service: AwsSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(AwsSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false on checkCloudDataExists when API endpoint is example', async () => {
    const result = await service.checkCloudDataExists('test-user', 'sistemas');
    expect(result).toBeFalse();
  });
});
