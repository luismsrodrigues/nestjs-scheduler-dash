export interface JobExecution {
  id: string;
  jobName: string;
  startedAt: string;
  finishedAt: string | null;
  status: 'running' | 'queued' | 'completed' | 'failed' | 'stopped';
  error?: string;
}

export interface JobMetrics {
  totalRuns: number;
  failedRuns: number;
  avgDurationMs: number;
}

export interface CronJob {
  name: string;
  cronExpression: string | null;
  active: boolean;   // job is enabled and has a future scheduled run
  running: boolean;  // job is currently mid-execution
  nextRun: string | null;
  history: JobExecution[];
  metrics: JobMetrics;
}

export interface JobsResponse {
  cron: CronJob[];
  intervals: { name: string }[];
  timeouts: { name: string }[];
}
