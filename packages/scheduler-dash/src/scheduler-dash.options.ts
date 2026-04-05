import { Storage } from './storage/storage.abstract';

export interface SchedulerDashAuth {
  username: string;
  password: string;
}

export interface SchedulerDashOptions {
  /**
   * Storage backend for job execution history.
   * @default new MemoryStorage()
   */
  storage?: Storage;
  /**
   * Base path for the dashboard routes.
   * @default '_jobs'
   */
  basePath?: string;
  /**
   * When set, the dashboard is served on a separate HTTP server on this port
   * instead of being mounted on the main NestJS application.
   */
  port?: number;
  /**
   * Maximum number of jobs that can run concurrently across all @TrackJob-decorated jobs.
   * Jobs that exceed this limit are queued (status: "queued") and executed in FIFO order
   * as slots become available.
   * When undefined, there is no global concurrency limit.
   */
  maxConcurrent?: number;
  /**
   * When true, a job that is still running will not be started again until it finishes.
   * Applies to all jobs decorated with @TrackJob. Can be overridden per-job.
   * @default false
   */
  noOverlap?: boolean;
  /**
   * When set, all dashboard routes require HTTP Basic Auth.
   */
  auth?: SchedulerDashAuth;
}
