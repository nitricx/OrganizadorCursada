import { TestBed } from '@angular/core/testing';
import { VotingNullifierService } from './voting-nullifier.service';

describe('VotingNullifierService', () => {
  let service: VotingNullifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VotingNullifierService);
  });

  it('should generate deterministic action nullifier with retention weight', async () => {
    const res1 = await service.generateActionNullifier('plan1', 'upvote', '2026-Q3');
    const res2 = await service.generateActionNullifier('plan1', 'upvote', '2026-Q3');

    expect(res1.nullifier).toBe(res2.nullifier);
    expect(typeof res1.retentionWeight).toBe('number');
    expect(res1.retentionWeight).toBeGreaterThanOrEqual(1.0);
  });
});
