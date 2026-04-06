import { Cron } from '@nestjs/schedule';
import type { CronOptions } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { SchedulerDashContext } from '../scheduler-dash.context';
import {
  isOverlapping,
  isConcurrencyLimitReached,
  enqueueEntry,
  onJobStart,
  onJobEnd,
  registerRunningExecution,
  unregisterRunningExecution,
  wasExecutionStopped,
  consumeStoppedExecution,
} from './job-concurrency';

export type TrackJobOptions = CronOptions & {
  noOverlap?: boolean;
};

function formatError(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err);
}

async function runWithoutStorage(
  instance: unknown,
  args: unknown[],
  jobName: string,
  original: (...a: unknown[]) => unknown,
): Promise<unknown> {
  onJobStart(jobName);
  try {
    return await original.apply(instance, args);
  } finally {
    onJobEnd(jobName);
  }
}

async function runImmediately(
  instance: unknown,
  args: unknown[],
  jobName: string,
  original: (...a: unknown[]) => unknown,
): Promise<unknown> {
  const storage = SchedulerDashContext.storage!;
  const id = randomUUID();

  storage.save({ id, jobName, startedAt: new Date(), finishedAt: null, status: 'running' });
  onJobStart(jobName);
  registerRunningExecution(id, jobName, storage);

  try {
    const result = await original.apply(instance, args);
    if (!wasExecutionStopped(id)) {
      storage.update(id, { finishedAt: new Date(), status: 'completed' });
    }
    return result;
  } catch (err) {
    if (!wasExecutionStopped(id)) {
      storage.update(id, { finishedAt: new Date(), status: 'failed', error: formatError(err) });
    }
    throw err;
  } finally {
    unregisterRunningExecution(id);
    if (!consumeStoppedExecution(id)) {
      onJobEnd(jobName);
    }
  }
}

function queueExecution(
  instance: unknown,
  args: unknown[],
  jobName: string,
  noOverlap: boolean,
  original: (...a: unknown[]) => unknown,
): void {
  const storage = SchedulerDashContext.storage!;
  const id = randomUUID();
  storage.save({ id, jobName, startedAt: new Date(), finishedAt: null, status: 'queued' });
  enqueueEntry({ instance, args, jobName, executionId: id, noOverlap, original, storage });
}

export function TrackJob(
  cronTime: Parameters<typeof Cron>[0],
  options?: TrackJobOptions,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const jobName = options?.name ?? `${(target as any).constructor.name}.${String(propertyKey)}`;
    const jobNoOverlap = options?.noOverlap;

    if (options?.disabled) {
      SchedulerDashContext.disabledJobs.add(jobName);
    }

    descriptor.value = async function (...args: unknown[]) {
      const noOverlap = jobNoOverlap ?? SchedulerDashContext.noOverlap;
      const storage = SchedulerDashContext.storage;

      if (isOverlapping(jobName, noOverlap)) return;
      if (!storage) return runWithoutStorage(this, args, jobName, original);
      if (isConcurrencyLimitReached()) {
        queueExecution(this, args, jobName, noOverlap, original);
        return;
      }

      return runImmediately(this, args, jobName, original);
    };

    const { noOverlap: _, ...cronOptions } = options ?? {};
    Cron(cronTime, { name: jobName, ...cronOptions })(target, propertyKey, descriptor);

    return descriptor;
  };
}
