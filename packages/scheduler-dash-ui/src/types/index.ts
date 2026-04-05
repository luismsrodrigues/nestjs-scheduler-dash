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
  running: boolean;
  nextRun: string;
  history: JobExecution[];
  metrics: JobMetrics;
}

export interface JobsResponse {
  cron: CronJob[];
  intervals: { name: string }[];
  timeouts: { name: string }[];
}
