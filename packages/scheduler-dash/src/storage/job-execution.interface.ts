export interface JobExecution {
  id: string;
  jobName: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}
