import type { JobsResponse } from '@/types';

/**
 * Resolves to the path where the dashboard is mounted (e.g. "/_scheduler/").
 * With HashRouter, window.location.pathname is always the mount path regardless
 * of the current hash route, so API calls automatically use the correct prefix.
 */
function apiBase(): string {
  const p = window.location.pathname;
  return p.endsWith('/') ? p : `${p}/`;
}

export async function fetchJobs(): Promise<JobsResponse> {
  const res = await fetch(`${apiBase()}api`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function triggerJob(name: string): Promise<void> {
  const res = await fetch(`${apiBase()}api/${encodeURIComponent(name)}/trigger`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger job: ${res.status}`);
}

export async function stopExecution(id: string): Promise<void> {
  const res = await fetch(`${apiBase()}api/executions/${encodeURIComponent(id)}/stop`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to stop execution: ${res.status}`);
}
