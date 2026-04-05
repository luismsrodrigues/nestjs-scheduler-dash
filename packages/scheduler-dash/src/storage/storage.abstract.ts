import { JobExecution } from './job-execution.interface';

export abstract class Storage {
<<<<<<< Updated upstream
=======
  // public required for z.instanceof() in schema validation
  constructor(protected readonly _options: IStorageOptions = {}) {}

>>>>>>> Stashed changes
  abstract save(execution: JobExecution): void;
  abstract update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void;
  abstract findByJob(jobName: string): JobExecution[];
  abstract findAll(): Record<string, JobExecution[]>;
}
