export interface JobExecution {
  id: string;
  jobName: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'running' | 'queued' | 'completed' | 'failed';
  error?: string;
}

export interface CronJob {
  name: string;
  cronExpression: string | null;
  running: boolean;
  nextRun: string;
  history: JobExecution[];
}

export interface JobsResponse {
  cron: CronJob[];
  intervals: { name: string }[];
  timeouts: { name: string }[];
}
