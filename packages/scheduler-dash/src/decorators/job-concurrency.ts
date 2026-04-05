import { SchedulerDashContext } from '../scheduler-dash.context';
import { Storage } from '../storage/storage.abstract';

interface QueueEntry {
  instance: unknown;
  args: unknown[];
  jobName: string;
  executionId: string;
  noOverlap: boolean;
  original: (...a: unknown[]) => unknown;
  storage: Storage;
}

interface RunningExecution {
  jobName: string;
  storage: Storage;
}

let runningCount = 0;
const runningJobs = new Set<string>();
const queue: QueueEntry[] = [];
const runningExecutions = new Map<string, RunningExecution>();
const stoppedExecutions = new Set<string>();

export function isOverlapping(jobName: string, noOverlap: boolean): boolean {
  return noOverlap && runningJobs.has(jobName);
}

export function isConcurrencyLimitReached(): boolean {
  const max = SchedulerDashContext.maxConcurrent;
  return max !== undefined && runningCount >= max;
}

export function onJobStart(jobName: string): void {
  runningCount++;
  runningJobs.add(jobName);
}

export function onJobEnd(jobName: string): void {
  runningCount--;
  runningJobs.delete(jobName);
  drainQueue();
}

export function enqueueEntry(entry: QueueEntry): void {
  queue.push(entry);
}

export function registerRunningExecution(id: string, jobName: string, storage: Storage): void {
  runningExecutions.set(id, { jobName, storage });
}

export function unregisterRunningExecution(id: string): void {
  runningExecutions.delete(id);
}

export function wasExecutionStopped(id: string): boolean {
  return stoppedExecutions.has(id);
}

export function consumeStoppedExecution(id: string): boolean {
  return stoppedExecutions.delete(id);
}

export function stopExecutionById(executionId: string): boolean {
  const queueIdx = queue.findIndex(e => e.executionId === executionId);
  if (queueIdx !== -1) {
    const [entry] = queue.splice(queueIdx, 1);
    entry.storage.update(executionId, { finishedAt: new Date(), status: 'stopped' });
    return true;
  }

  const running = runningExecutions.get(executionId);
  if (running) {
    stoppedExecutions.add(executionId);
    runningExecutions.delete(executionId);
    running.storage.update(executionId, { finishedAt: new Date(), status: 'stopped' });
    onJobEnd(running.jobName);
    return true;
  }

  return false;
}

function drainQueue(): void {
  while (queue.length > 0 && !isConcurrencyLimitReached()) {
    const entry = queue.shift()!;
    if (isOverlapping(entry.jobName, entry.noOverlap)) {
      entry.storage.update(entry.executionId, { finishedAt: new Date(), status: 'stopped' });
      continue;
    }
    runEntry(entry);
  }
}

export function runEntry(entry: QueueEntry): void {
  const { instance, args, jobName, executionId, original, storage } = entry;

  storage.update(executionId, { status: 'running' });
  onJobStart(jobName);
  registerRunningExecution(executionId, jobName, storage);

  (async () => {
    try {
      await original.apply(instance, args);
      if (!wasExecutionStopped(executionId)) {
        storage.update(executionId, { finishedAt: new Date(), status: 'completed' });
      }
    } catch (err) {
      if (!wasExecutionStopped(executionId)) {
        const error = err instanceof Error ? (err.stack ?? err.message) : String(err);
        storage.update(executionId, { finishedAt: new Date(), status: 'failed', error });
      }
    } finally {
      unregisterRunningExecution(executionId);
      if (!consumeStoppedExecution(executionId)) {
        onJobEnd(jobName);
      }
    }
  })();
}
