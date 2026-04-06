import type { ModuleMetadata } from '@nestjs/common';
import { Storage } from './storage/storage.abstract';

export interface SchedulerDashAuth {
  username: string;
  password: string;
}

export interface SchedulerDashOptions {
  storage?: Storage;
  route?: string;
  maxConcurrent?: number;
  noOverlap?: boolean;
  auth?: SchedulerDashAuth;
}

export interface SchedulerDashAsyncOptions {
  /** NestJS modules whose providers should be available to `useFactory`. */
  imports?: ModuleMetadata['imports'];
  /** Providers to inject into `useFactory` as positional arguments. */
  inject?: any[];
  /** Factory that receives the injected providers and returns the options object. */
  useFactory: (...args: any[]) => Promise<SchedulerDashOptions> | SchedulerDashOptions;
}
