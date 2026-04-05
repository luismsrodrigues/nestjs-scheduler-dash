import { Storage } from './storage/storage.abstract';

/**
 * Module-level singleton that gives decorators late-bound access to the
 * configured storage instance (set when the module bootstraps).
 */
export class SchedulerDashContext {
  static storage: Storage | null = null;
}
