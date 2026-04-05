import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { StorageService } from './storage.service';
import { stopExecutionById } from './decorators/job-concurrency';

@Injectable()
export class JobsService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly storageService: StorageService,
  ) {}

  getJobs() {
    const cron = [...this.schedulerRegistry.getCronJobs().entries()].map(([name, job]) => ({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: this.storageService.findByJob(name),
      metrics: this.storageService.getMetrics(name),
    }));

    const intervals = this.schedulerRegistry.getIntervals().map((name) => ({ name }));
    const timeouts = this.schedulerRegistry.getTimeouts().map((name) => ({ name }));

    return { cron, intervals, timeouts };
  }

  triggerJob(name: string): boolean {
    const job = this.schedulerRegistry.getCronJobs().get(name);
    if (!job) return false;
    job.fireOnTick();
    return true;
  }

  stopExecution(executionId: string): boolean {
    return stopExecutionById(executionId);
  }
}
