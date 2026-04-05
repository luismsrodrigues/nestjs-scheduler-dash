import { Storage, IStorageOptions } from './storage.abstract';
import { JobExecution } from './job-execution.interface';
import { JobMetrics } from './job-metrics.interface';

interface MetricsAccumulator {
  totalRuns: number;
  failedRuns: number;
  durationSum: number;
  durationCount: number;
}

export class MemoryStorage extends Storage {
  private readonly store = new Map<string, JobExecution[]>();
  private readonly metricsStore = new Map<string, MetricsAccumulator>();

  constructor(options: IStorageOptions = {}) {
    super(options);
  }

  save(execution: JobExecution): void {
    const history = this.store.get(execution.jobName) ?? [];
    history.push(execution);

    if (this._options.historyRetention !== undefined && history.length > this._options.historyRetention) {
      history.shift();
    }

    this.store.set(execution.jobName, history);
  }

  update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void {
    for (const [jobName, history] of this.store.entries()) {
      const execution = history.find((e) => e.id === id);
      if (!execution) continue;

      const wasFinished = execution.finishedAt !== null;
      Object.assign(execution, data);

      if (!wasFinished && data.finishedAt && data.status) {
        this.recordMetric(jobName, execution, data.status);
      }

      return;
    }
  }

  findByJob(jobName: string): JobExecution[] {
    return this.store.get(jobName) ?? [];
  }

  findAll(): Record<string, JobExecution[]> {
    return Object.fromEntries(this.store.entries());
  }

  getMetrics(jobName: string): JobMetrics {
    return this.toJobMetrics(this.metricsStore.get(jobName));
  }

  getAllMetrics(): Record<string, JobMetrics> {
    const result: Record<string, JobMetrics> = {};
    for (const [jobName, acc] of this.metricsStore.entries()) {
      result[jobName] = this.toJobMetrics(acc);
    }
    return result;
  }

  private recordMetric(jobName: string, execution: JobExecution, status: JobExecution['status']): void {
    const acc = this.metricsStore.get(jobName) ?? { totalRuns: 0, failedRuns: 0, durationSum: 0, durationCount: 0 };

    acc.totalRuns++;

    if (status === 'failed') {
      acc.failedRuns++;
    }

    if (execution.finishedAt) {
      const duration = execution.finishedAt.getTime() - execution.startedAt.getTime();
      acc.durationSum += duration;
      acc.durationCount++;
    }

    this.metricsStore.set(jobName, acc);
  }

  private toJobMetrics(acc: MetricsAccumulator | undefined): JobMetrics {
    if (!acc) return { totalRuns: 0, failedRuns: 0, avgDurationMs: 0 };
    return {
      totalRuns: acc.totalRuns,
      failedRuns: acc.failedRuns,
      avgDurationMs: acc.durationCount > 0 ? Math.round(acc.durationSum / acc.durationCount) : 0,
    };
  }
}
