import { Inject, Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SCHEDULER_DASH_STORAGE } from './scheduler-dash.options';
import { Storage } from './storage/storage.abstract';

@Injectable()
export class JobsService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(SCHEDULER_DASH_STORAGE) private readonly storage: Storage,
  ) {}

  getJobs() {
    const cron = [...this.schedulerRegistry.getCronJobs().entries()].map(([name, job]) => ({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: this.storage.findByJob(name),
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

  stopJob(name: string): boolean {
    const job = this.schedulerRegistry.getCronJobs().get(name);
    if (!job) return false;
    job.stop();
    return true;
  }

  startJob(name: string): boolean {
    const job = this.schedulerRegistry.getCronJobs().get(name);
    if (!job) return false;
    job.start();
    return true;
  }
}
