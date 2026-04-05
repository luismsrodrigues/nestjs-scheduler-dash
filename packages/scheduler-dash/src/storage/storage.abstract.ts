import { JobExecution } from './job-execution.interface';
import { JobMetrics } from './job-metrics.interface';

export interface IStorageOptions {
  historyRetention?: number;
}

export abstract class Storage {
  protected constructor(protected readonly _options: IStorageOptions = {}) {}

  abstract save(execution: JobExecution): void;
  abstract update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void;
  abstract findByJob(jobName: string): JobExecution[];
  abstract findAll(): Record<string, JobExecution[]>;
  abstract getMetrics(jobName: string): JobMetrics;
  abstract getAllMetrics(): Record<string, JobMetrics>;
}
