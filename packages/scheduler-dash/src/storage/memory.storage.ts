import { Storage } from './storage.abstract';
import { JobExecution } from './job-execution.interface';

export interface MemoryStorageOptions {
  maxExecutions?: number;
}

export class MemoryStorage extends Storage {
  private readonly store = new Map<string, JobExecution[]>();
  private readonly maxExecutions: number;

  constructor(options: MemoryStorageOptions = {}) {
    super();
    this.maxExecutions = options.maxExecutions ?? Infinity;
  }

  save(execution: JobExecution): void {
    const history = this.store.get(execution.jobName) ?? [];
    history.push(execution);

    if (history.length > this.maxExecutions) {
      history.splice(0, history.length - this.maxExecutions);
    }

    this.store.set(execution.jobName, history);
  }

  update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void {
    for (const history of this.store.values()) {
      const execution = history.find((e) => e.id === id);
      if (execution) {
        Object.assign(execution, data);
        return;
      }
    }
  }

  findByJob(jobName: string): JobExecution[] {
    return this.store.get(jobName) ?? [];
  }

  findAll(): Record<string, JobExecution[]> {
    return Object.fromEntries(this.store.entries());
  }
}
