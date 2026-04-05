import { JobExecution } from './job-execution.interface';

export abstract class Storage {
  abstract save(execution: JobExecution): void;
  abstract update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void;
  abstract findByJob(jobName: string): JobExecution[];
  abstract findAll(): Record<string, JobExecution[]>;
}
