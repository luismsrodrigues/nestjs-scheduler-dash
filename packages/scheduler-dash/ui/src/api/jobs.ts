import type { JobsResponse } from '../types';

function getBase(): string {
  const base = window.__SCHEDULER_BASE__ ?? '/_jobs';
  return `${base}/api`;
}

export async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch(getBase());
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function triggerJob(name: string): Promise<void> {
  const res = await fetch(`${getBase()}/${encodeURIComponent(name)}/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`);
}

export async function stopExecution(executionId: string): Promise<void> {
  const res = await fetch(`${getBase()}/executions/${encodeURIComponent(executionId)}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to stop execution: ${res.status}`);
}
