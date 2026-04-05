export interface JobExecution {
  id: string;
  jobName: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: 'running' | 'queued' | 'completed' | 'failed' | 'stopped';
  error?: string;
}
