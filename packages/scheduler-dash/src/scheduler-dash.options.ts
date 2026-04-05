import { Storage } from './storage/storage.abstract';

export interface SchedulerDashAuth {
  username: string;
  password: string;
}

export interface SchedulerDashOptions {
  storage: Storage;
  /**
   * When set, the dashboard and its API are served on a separate HTTP server
   * on this port instead of on the main NestJS application.
   */
  port?: number;
  /**
   * When set, all /_jobs routes require HTTP Basic Auth.
   */
  auth?: SchedulerDashAuth;
}

export const SCHEDULER_DASH_STORAGE = Symbol('SCHEDULER_DASH_STORAGE');
export const SCHEDULER_DASH_OPTIONS = Symbol('SCHEDULER_DASH_OPTIONS');
