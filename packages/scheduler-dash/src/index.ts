import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerDashContext } from './scheduler-dash.context';
import { SchedulerDashOptions } from './scheduler-dash.options';
import { SchedulerDashOptionsSchema } from './scheduler-dash.schema';
import { DashboardModule } from './dashboard.module';
import { JobsService } from './jobs.service';
import { startStandaloneServer } from './standalone-server';

export { TrackJob } from './decorators/track-job.decorator';
export { Storage } from './storage/storage.abstract';
export type { IStorageOptions } from './storage/storage.abstract';
export { MemoryStorage } from './storage/memory.storage';
export type { JobExecution } from './storage/job-execution.interface';
export type { JobMetrics } from './storage/job-metrics.interface';
export type { SchedulerDashOptions, SchedulerDashAuth } from './scheduler-dash.options';

const DEFAULT_PORT = 3636;

export async function setupSchedulerDash(
  app: INestApplication,
  options: SchedulerDashOptions = {},
): Promise<void> {
  const parsed = SchedulerDashOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(
      `[SchedulerDash] Invalid options:\n${parsed.error.issues.map(i => `  • ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  }

  const port   = options.port ?? DEFAULT_PORT;
  const logger = new Logger('SchedulerDash', { timestamp: true });

  @Module({ imports: [DashboardModule.forRoot(options)] })
  class _InternalDashboardApp {}

  await NestFactory.createApplicationContext(_InternalDashboardApp, { logger: false });

  const storage           = SchedulerDashContext.storage!;
  const schedulerRegistry = app.get(SchedulerRegistry);
  const jobsService       = new JobsService(schedulerRegistry, storage);

  startStandaloneServer(port, jobsService, options.auth, logger);
}
