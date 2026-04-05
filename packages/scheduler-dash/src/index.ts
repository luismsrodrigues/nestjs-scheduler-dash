import { INestApplication, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerDashContext } from './scheduler-dash.context';
import { SchedulerDashOptions } from './scheduler-dash.options';
import { SchedulerDashOptionsSchema } from './scheduler-dash.schema';
import { JobsService } from './jobs.service';
import { MemoryStorage } from './storage/memory.storage';
import { startStandaloneServer } from './standalone-server';
import { mountOnApp } from './embedded-server';

export { TrackJob } from './decorators/track-job.decorator';
export { Storage } from './storage/storage.abstract';
export type { IStorageOptions } from './storage/storage.abstract';
export { MemoryStorage } from './storage/memory.storage';
export type { JobExecution } from './storage/job-execution.interface';
export type { JobMetrics } from './storage/job-metrics.interface';
export type { SchedulerDashOptions, SchedulerDashAuth } from './scheduler-dash.options';

export async function setupSchedulerDash(
  app: INestApplication,
  options: SchedulerDashOptions = {},
): Promise<void> {
  const parsed = SchedulerDashOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(`[SchedulerDash] Invalid options:\n${parsed.error.issues.map(i => `  • ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }

  const storage = options.storage ?? new MemoryStorage({
    historyRetention: 10
  });
  const basePath = (options.basePath ?? '_jobs').replace(/^\//, '');
  const logger = new Logger('SchedulerDash-Dashboard', { timestamp: true });

  SchedulerDashContext.storage = storage;
  SchedulerDashContext.basePath = basePath;
  SchedulerDashContext.noOverlap = options.noOverlap ?? false;
  SchedulerDashContext.maxConcurrent = options.maxConcurrent;

  const schedulerRegistry = app.get(SchedulerRegistry);
  const jobsService = new JobsService(schedulerRegistry, storage);

  if (options.port) {
    startStandaloneServer(options.port, basePath, jobsService, options.auth, logger);
  } else {
    mountOnApp(app, basePath, jobsService, options.auth, logger);
  }
}
