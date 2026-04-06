import type { Storage } from './storage/storage.abstract';

// Key in globalThis — shared across all module instances (avoids duplicate-module bugs in monorepos)
const KEY = '__nestjs_scheduler_dashboard__';

interface Ctx {
  storage: Storage | null;
  noOverlap: boolean;
  maxConcurrent: number | undefined;
  disabledJobs: Set<string>;
}

function getCtx(): Ctx {
  const g = globalThis as Record<string, unknown>;
  if (!g[KEY]) {
    g[KEY] = { storage: null, noOverlap: false, maxConcurrent: undefined, disabledJobs: new Set<string>() } satisfies Ctx;
  }
  return g[KEY] as Ctx;
}

export const SchedulerDashContext = {
  get storage(): Storage | null             { return getCtx().storage; },
  set storage(v: Storage | null)            { getCtx().storage = v; },
  get noOverlap(): boolean                  { return getCtx().noOverlap; },
  set noOverlap(v: boolean)                 { getCtx().noOverlap = v; },
  get maxConcurrent(): number | undefined   { return getCtx().maxConcurrent; },
  set maxConcurrent(v: number | undefined)  { getCtx().maxConcurrent = v; },
  get disabledJobs(): Set<string>           { return getCtx().disabledJobs; },
};
