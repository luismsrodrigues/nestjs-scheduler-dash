import { Storage } from './storage/storage.abstract';

/**
 * Module-level singleton that gives decorators late-bound access to the
 * configured storage instance and options (set when the module bootstraps).
 */
export class SchedulerDashContext {
  static storage: Storage | null = null;
  static basePath: string = '_jobs';
  static noOverlap: boolean = false;
  static maxConcurrent: number | undefined = undefined;
}
