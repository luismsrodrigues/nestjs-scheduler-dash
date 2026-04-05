import { SchedulerDashContext } from '../scheduler-dash.context';
import type { Storage } from '../storage/storage.abstract';

export interface QueuedEntry {
  instance: unknown;
  args: unknown[];
  jobName: string;
  executionId: string;
  noOverlap: boolean;
  original: (...a: unknown[]) => unknown;
  storage: Storage;
}

let runningCount = 0;
const runningJobs = new Set<string>();
const queue: QueuedEntry[] = [];

export function isOverlapping(jobName: string, noOverlap: boolean): boolean {
  return noOverlap && runningJobs.has(jobName);
}

export function isConcurrencyLimitReached(): boolean {
  const max = SchedulerDashContext.maxConcurrent;
  return max !== undefined && runningCount >= max;
}

function onJobStart(jobName: string): void {
  runningCount++;
  runningJobs.add(jobName);
}

function onJobEnd(jobName: string): void {
  runningCount--;
  runningJobs.delete(jobName);
  drainQueue();
}

export function enqueueEntry(entry: QueuedEntry): void {
  queue.push(entry);
}

function nextEligibleIndex(): number {
  return queue.findIndex(e => !e.noOverlap || !runningJobs.has(e.jobName));
}

function drainQueue(): void {
  const max = SchedulerDashContext.maxConcurrent;
  if (max === undefined) return;

  while (runningCount < max) {
    const idx = nextEligibleIndex();
    if (idx === -1) break;
    const [entry] = queue.splice(idx, 1);
    runEntry(entry);
  }
}

function formatError(err: unknown): string {
  return err instanceof Error ? (err.stack ?? err.message) : String(err);
}

export function runEntry(entry: QueuedEntry): void {
  const { instance, args, jobName, executionId, original, storage } = entry;

  onJobStart(jobName);
  storage.update(executionId, { status: 'running' });

  Promise.resolve(original.apply(instance, args))
    .then(() => {
      storage.update(executionId, { finishedAt: new Date(), status: 'completed' });
    })
    .catch((err: unknown) => {
      storage.update(executionId, { finishedAt: new Date(), status: 'failed', error: formatError(err) });
    })
    .finally(() => {
      onJobEnd(jobName);
    });
}

export { onJobStart, onJobEnd };
