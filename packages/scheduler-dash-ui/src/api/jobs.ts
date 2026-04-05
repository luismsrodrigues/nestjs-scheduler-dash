import type { JobsResponse } from '@/types';

declare global {
  interface Window {
    __SCHEDULER_BASE__?: string;
  }
}

function getBase(): string {
  return '/' + (window.__SCHEDULER_BASE__ ?? '');
}

export async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch(`${getBase()}/api`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function triggerJob(name: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/${encodeURIComponent(name)}/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`);
}

export async function stopExecution(id: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/executions/${encodeURIComponent(id)}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to stop execution: ${res.status}`);
}
