import { Cron } from '@nestjs/schedule';
import type { CronOptions } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { SchedulerDashContext } from '../scheduler-dash.context';

/**
 * Drop-in replacement for @Cron that also tracks execution history.
 * Wraps the method before NestJS's own try-catch so errors are recorded
 * as "failed" instead of being silently swallowed.
 *
 * If no `options.name` is provided, the method name is used — ensuring the
 * job name is always stable and matches what SchedulerRegistry exposes.
 */
export function TrackJob(
  cronTime: Parameters<typeof Cron>[0],
  options?: CronOptions,
): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const jobName = options?.name ?? String(propertyKey);

    // 1. Wrap the method for error tracking (runs before NestJS's wrapper)
    descriptor.value = async function (...args: unknown[]) {
      const storage = SchedulerDashContext.storage;

      if (!storage) {
        return original.apply(this, args);
      }

      const id = randomUUID();
      storage.save({ id, jobName, startedAt: new Date(), finishedAt: null, status: 'running' });

      try {
        const result = await original.apply(this, args);
        storage.update(id, { finishedAt: new Date(), status: 'completed' });
        return result;
      } catch (err) {
        storage.update(id, {
          finishedAt: new Date(),
          status: 'failed',
          error: err instanceof Error ? (err.stack ?? err.message) : String(err),
        });
        throw err; // rethrow so NestJS still logs it via [Scheduler]
      }
    };

    // 2. Apply @Cron with the resolved name so SchedulerRegistry uses the same key
    Cron(cronTime, { name: jobName, ...options })(target, propertyKey, descriptor);

    return descriptor;
  };
}
