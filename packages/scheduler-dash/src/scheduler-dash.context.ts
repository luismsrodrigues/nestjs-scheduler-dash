import { Storage } from './storage/storage.abstract';

export class SchedulerDashContext {
  static storage: Storage | null = null;
  static basePath: string = '_jobs';
  static noOverlap: boolean = false;
  static maxConcurrent: number | undefined = undefined;
}
