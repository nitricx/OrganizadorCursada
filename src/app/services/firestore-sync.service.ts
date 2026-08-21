import { Injectable } from '@angular/core';
import { AwsSyncService, UserCareerStateDoc } from './aws-sync.service';

export type { UserCareerStateDoc };

@Injectable({
  providedIn: 'root',
})
export class FirestoreSyncService extends AwsSyncService {}
