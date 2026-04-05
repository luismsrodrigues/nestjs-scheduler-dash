import { SchedulerRegistry } from '@nestjs/schedule';
import { Storage } from './storage/storage.abstract';

export class JobsService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly storage: Storage,
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
}
