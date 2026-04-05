import { Injectable } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { StorageService } from './storage.service';
import { SchedulerDashService } from './scheduler-dash.service';
import { stopExecutionById } from './decorators/job-concurrency';

@Injectable()
export class DashboardService {
  private hostApp: INestApplication | null = null;

  constructor(
    private readonly storageService: StorageService,
    private readonly schedulerDashService: SchedulerDashService,
  ) {}

  setHostApp(app: INestApplication) {
    this.hostApp = app;
  }

  getJobs() {
    if (!this.hostApp) {
      return { cron: [], intervals: [], timeouts: [] };
    }

    const schedulerRegistry = this.hostApp.get(SchedulerRegistry);

    const cron = [...schedulerRegistry.getCronJobs().entries()].map(([name, job]) => ({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: this.storageService.findByJob(name),
      metrics: this.storageService.getMetrics(name),
    }));

    const intervals = schedulerRegistry.getIntervals().map((name) => ({ name }));
    const timeouts = schedulerRegistry.getTimeouts().map((name) => ({ name }));

    return { cron, intervals, timeouts };
  }

  triggerJob(name: string): boolean {
    if (!this.hostApp) return false;

    const schedulerRegistry = this.hostApp.get(SchedulerRegistry);
    const job = schedulerRegistry.getCronJobs().get(name);
    if (!job) return false;
    
    job.fireOnTick();
    return true;
  }

  stopExecution(executionId: string): boolean {
    return stopExecutionById(executionId);
  }
}
