import type { JobsResponse } from '../types';

const BASE = '/_jobs/api';

export async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function triggerJob(name: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`);
}

export async function stopJob(name: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to stop job: ${res.status}`);
}

export async function startJob(name: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(name)}/start`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to start job: ${res.status}`);
}
