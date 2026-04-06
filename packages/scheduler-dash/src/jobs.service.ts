import { Injectable, Inject } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Storage } from './storage/storage.abstract';
import { stopExecutionById } from './decorators/job-concurrency';
import { SchedulerDashContext } from './scheduler-dash.context';
import { STORAGE_TOKEN } from './scheduler-dash.constants';

/**
 * Resolves the next run date across cron library versions:
 * - cron v2 / schedule v2-v3: nextDate() returns luxon.DateTime (has .toISO())
 * - cron v3 / schedule v4-v6: nextDate() returns Date | null
 */
function resolveNextRun(job: any): string | null {
  try {
    const next = job.nextDate?.();
    if (!next) return null;
    if (typeof next.toISO === 'function') return next.toISO();          // luxon DateTime
    if (next instanceof Date) return next.toISOString();                // native Date
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves the cron expression string across schedule versions:
 * - cron v2 / schedule v2-v3: cronTime.source (string)
 * - cron v3 / schedule v4-v6: cronTime._source or cronTime.toString()
 */
function resolveCronExpression(cronTime: unknown): string | null {
  if (!cronTime || typeof cronTime !== 'object') return null;
  const ct = cronTime as Record<string, unknown>;
  const src = ct['source'] ?? ct['_source'];
  if (typeof src === 'string') return src;
  const str = (cronTime as any).toString?.();
  return str && str !== '[object Object]' ? str : null;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(STORAGE_TOKEN) private readonly storage: Storage,
  ) {}

  getJobs() {
    const cron = [...this.schedulerRegistry.getCronJobs().entries()].map(([name, job]) => {
      const nextRun = resolveNextRun(job);
      return {
        name,
        cronExpression: resolveCronExpression(job.cronTime),
        active: !SchedulerDashContext.disabledJobs.has(name),
        running: job.running ?? false, // job is currently mid-execution
        nextRun,
        history: this.storage.findByJob(name),
        metrics: this.storage.getMetrics(name),
      };
    });

    const intervals = this.schedulerRegistry.getIntervals().map((name) => ({ name }));
    const timeouts  = this.schedulerRegistry.getTimeouts().map((name) => ({ name }));

    return { cron, intervals, timeouts };
  }

  getJob(name: string) {
    const job = this.schedulerRegistry.getCronJobs().get(name);
    if (!job) return null;
    const nextRun = resolveNextRun(job);
    return {
      name,
      cronExpression: resolveCronExpression(job.cronTime),
      active: !SchedulerDashContext.disabledJobs.has(name),
      running: job.running ?? false,
      nextRun,
      history: this.storage.findByJob(name),
      metrics: this.storage.getMetrics(name),
    };
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
