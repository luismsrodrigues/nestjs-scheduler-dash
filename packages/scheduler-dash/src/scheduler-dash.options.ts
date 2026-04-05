import { Storage } from './storage/storage.abstract';

export interface SchedulerDashAuth {
  username: string;
  password: string;
}

export interface SchedulerDashOptions {
  storage?: Storage;
  port?: number;
  maxConcurrent?: number;
  noOverlap?: boolean;
  auth?: SchedulerDashAuth;
}
