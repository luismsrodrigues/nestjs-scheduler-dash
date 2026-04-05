import { NestFactory } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SchedulerDashOptions } from './scheduler-dash.options';
import { SchedulerDashOptionsSchema } from './scheduler-dash.schema';
import { SchedulerDashCoreModule } from './scheduler-dash-core.module';
import { SchedulerDashService } from './scheduler-dash.service';
import { StorageService } from './storage.service';
import { dashboardHtml, CONFIG_PLACEHOLDER } from './ui/dashboard';
import { createAuthGuard } from './auth';
import { stopExecutionById } from './decorators/job-concurrency';

const DEFAULT_PORT = 3636;

export { TrackJob } from './decorators/track-job.decorator';
export { Storage } from './storage/storage.abstract';
export type { IStorageOptions } from './storage/storage.abstract';
export { MemoryStorage } from './storage/memory.storage';
export type { JobExecution } from './storage/job-execution.interface';
export type { JobMetrics } from './storage/job-metrics.interface';
export type { SchedulerDashOptions, SchedulerDashAuth } from './scheduler-dash.options';
export { SchedulerDashService } from './scheduler-dash.service';

export async function setupSchedulerDash(
  hostApp: INestApplication,
  options: SchedulerDashOptions = {},
): Promise<INestApplication> {
  const parsed = SchedulerDashOptionsSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(
      `[SchedulerDash] Invalid options:\n${parsed.error.issues.map(i => `  • ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    );
  }

  const port = options.port ?? DEFAULT_PORT;
  const basePath = (options.basePath ?? '_jobs').replace(/^\//, '');
  const logger = new Logger('SchedulerDash', { timestamp: true });

  @Module({
    imports: [SchedulerDashCoreModule.forRoot(options)],
  })
  class DashboardModule {}

  const app = await NestFactory.create(DashboardModule);

  const schedulerDashService = app.get(SchedulerDashService);
  schedulerDashService.basePath = basePath;
  schedulerDashService.noOverlap = options.noOverlap ?? false;
  schedulerDashService.maxConcurrent = options.maxConcurrent;

  const storageService = app.get(StorageService);
  const hostRegistry = hostApp.get(SchedulerRegistry);

  const expressApp = app.getHttpAdapter().getInstance();
  const guard = createAuthGuard(options.auth);
  const html = dashboardHtml.replace(CONFIG_PLACEHOLDER, 
    `<script>window.__SCHEDULER_BASE__ = '${basePath}';</script>`);

  expressApp.get(`/${basePath}`, guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  expressApp.get(new RegExp(`^/${basePath}/jobs(?:/.*)?$`), guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  expressApp.get(`/${basePath}/api`, guard, (_req: any, res: any) => {
    const cron = [...hostRegistry.getCronJobs().entries()].map(([name, job]) => ({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: storageService.findByJob(name),
      metrics: storageService.getMetrics(name),
    }));

    const intervals = hostRegistry.getIntervals().map((name) => ({ name }));
    const timeouts = hostRegistry.getTimeouts().map((name) => ({ name }));

    res.json({ cron, intervals, timeouts });
  });

  expressApp.get(`/${basePath}/api/:name`, guard, (req: any, res: any) => {
    const name = decodeURIComponent(req.params.name);
    const job = hostRegistry.getCronJobs().get(name);
    if (!job) return res.status(404).json({ message: `Job "${name}" not found` });
    res.json({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: storageService.findByJob(name),
      metrics: storageService.getMetrics(name),
    });
  });

  expressApp.post(`/${basePath}/api/:name/trigger`, guard, (req: any, res: any) => {
    const name = decodeURIComponent(req.params.name);
    const job = hostRegistry.getCronJobs().get(name);
    if (!job) return res.status(404).json({ message: `Job "${name}" not found` });
    job.fireOnTick();
    res.json({ triggered: name });
  });

  expressApp.post(`/${basePath}/api/executions/:id/stop`, guard, (req: any, res: any) => {
    const id = decodeURIComponent(req.params.id);
    const ok = stopExecutionById(id);
    if (!ok) return res.status(404).json({ message: `Execution "${id}" not found` });
    res.json({ stopped: id });
  });

  await app.listen(port);
  logger.log(`Dashboard available at http://localhost:${port}/${basePath}`);
  
  return app;
}
