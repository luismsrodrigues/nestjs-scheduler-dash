import { Storage } from './storage/storage.abstract';

export interface SchedulerDashOptions {
  storage: Storage;
}

export const SCHEDULER_DASH_STORAGE = Symbol('SCHEDULER_DASH_STORAGE');
