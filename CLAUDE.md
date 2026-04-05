# CLAUDE.md — nestjs-scheduler-dashboard

This file captures key architecture decisions, constraints, and gotchas for this monorepo. Read it before making any changes.

---

## Repo structure

```
nestjs-scheduler-dashboard/
├── apps/
│   └── sample/                    # NestJS demo app (not published)
├── packages/
│   ├── scheduler-dash/            # Published library: @luisrodrigues/nestjs-scheduler-dashboard
│   │   └── src/
│   │       ├── index.ts                       # Public API + setupSchedulerDash()
│   │       ├── scheduler-dash.context.ts      # globalThis singleton (SchedulerDashContext)
│   │       ├── scheduler-dash.options.ts      # SchedulerDashOptions interface
│   │       ├── scheduler-dash.schema.ts       # Zod validation for options
│   │       ├── dashboard.module.ts            # Internal NestJS module (wires storage into context)
│   │       ├── standalone-server.ts           # Plain Node.js HTTP server (dashboard port)
│   │       ├── jobs.service.ts                # Reads SchedulerRegistry + Storage → REST responses
│   │       ├── auth.ts                        # HTTP Basic Auth helpers
│   │       ├── decorators/
│   │       │   ├── track-job.decorator.ts     # @TrackJob — wraps @Cron, records executions
│   │       │   └── job-concurrency.ts         # Running/queued state, overlap/concurrency logic
│   │       ├── storage/
│   │       │   ├── storage.abstract.ts        # Abstract Storage base class
│   │       │   ├── memory.storage.ts          # Default in-process implementation
│   │       │   ├── job-execution.interface.ts
│   │       │   └── job-metrics.interface.ts
│   │       └── ui/
│   │           └── dashboard.ts              # Auto-generated — do NOT edit by hand (see below)
│   └── scheduler-dash-ui/         # React + Tailwind UI (Vite, not published)
│       └── src/
│           ├── api/jobs.ts        # fetch('/api'), fetch('/api/:name/trigger'), etc.
│           └── main.tsx           # BrowserRouter, no basename
├── package.json                   # Workspace root scripts
└── pnpm-workspace.yaml
```

---

## Critical architectural decisions

### 1. Dashboard always runs on its own port

The dashboard is **never** embedded in the host NestJS app's HTTP server. `startStandaloneServer` creates a plain Node.js `http.createServer` on a dedicated port (default **3636**). There is no `basePath`, no route mounting, no Express middleware.

Routes served by the standalone server:
- `GET /` → dashboard HTML (SPA shell)
- `GET /jobs`, `GET /jobs/*` → same HTML (client-side routing)
- `GET /api` → JSON (all jobs + history + metrics)
- `POST /api/:name/trigger` → trigger a job
- `POST /api/executions/:id/stop` → stop a running/queued execution

### 2. `SchedulerDashContext` — the globalThis bridge

**Problem:** In a pnpm monorepo, the same package can be resolved to two different file paths (the published dist and the workspace source), creating two separate module instances. `@TrackJob` (loaded by the host app) and `DashboardModule` (loaded inside `NestFactory.createApplicationContext`) would each have their own module scope — the storage set by one would be invisible to the other.

**Solution:** `SchedulerDashContext` (`src/scheduler-dash.context.ts`) stores state on `globalThis['__nestjs_scheduler_dashboard__']`. All module instances share a single object in the JS runtime, regardless of how many times the module was loaded.

Never bypass this pattern. Do not pass storage through NestJS DI across the two contexts — it will break.

### 3. Internal NestJS context bootstrapping

`setupSchedulerDash` uses `NestFactory.createApplicationContext(_InternalDashboardApp, { logger: false })` — not `NestFactory.create`. This creates a DI context with no HTTP server. `DashboardModule.onModuleInit()` fires synchronously before the returned promise resolves, guaranteeing that `SchedulerDashContext.storage` is set **before** `app.listen()` and before any cron job can fire.

**Ordering requirement in `main.ts`:**
```ts
await setupSchedulerDash(app, { port: 3636 });  // MUST come first
await app.listen(3000);
```

### 4. UI is a single self-contained HTML file

The React UI is built by `packages/scheduler-dash-ui` using `vite-plugin-singlefile`, which inlines all JS/CSS into one HTML string. The output is written to `packages/scheduler-dash/src/ui/dashboard.ts` as:

```ts
export const dashboardHtml = `<!DOCTYPE html>...`;
```

**Do not edit `dashboard.ts` by hand.** Regenerate it with:
```bash
pnpm build
# or just the UI step:
cd packages/scheduler-dash-ui && pnpm build
```

The `prebuild` script in `packages/scheduler-dash/package.json` runs the UI build automatically before compiling the library TypeScript.

### 5. No `basePath` / no `window.__SCHEDULER_BASE__`

These were removed entirely. Do not re-introduce them. The dashboard runs on its own port, so all routes are always at root (`/`, `/api`, etc.) — no prefix is needed or wanted.

The React app uses `<BrowserRouter>` with no `basename`. All `fetch` calls in `src/api/jobs.ts` use hardcoded relative paths (`/api`, `/api/:name/trigger`, `/api/executions/:id/stop`).

---

## Sample app (apps/sample)

### Webpack alias — required for workspace development

Because `@luisrodrigues/nestjs-scheduler-dashboard` is a workspace dependency, NestJS CLI's webpack build must be told to bundle it from source instead of externalizing it. This is done in `apps/sample/webpack.config.js`:

```js
alias: {
  '@luisrodrigues/nestjs-scheduler-dashboard': path.resolve(__dirname, '../../packages/scheduler-dash/src/index.ts'),
}
```

And the package is excluded from webpack's `nodeExternals` so it gets bundled:
```js
if (ctx.request === '@luisrodrigues/nestjs-scheduler-dashboard') return callback(); // don't externalize
```

If you rename the package, update **both** the alias key and the externals check in `webpack.config.js`, then run `pnpm install` to refresh the workspace symlink.

### `nest-cli.json`

Uses `"webpack": true` and `"webpackConfigPath": "webpack.config.js"`. The custom webpack config is **required** for the workspace alias to work.

---

## Storage contract

All storage implementations must extend `Storage` from `storage.abstract.ts`:

```ts
abstract save(execution: JobExecution): void
abstract update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void
abstract findByJob(jobName: string): JobExecution[]
abstract findAll(): Record<string, JobExecution[]>
abstract getMetrics(jobName: string): JobMetrics
abstract getAllMetrics(): Record<string, JobMetrics>
```

`MemoryStorage` uses a separate `MetricsAccumulator` per job that is **never trimmed** — metrics survive `historyRetention` pruning. Only `update()` calls with a non-null `finishedAt` contribute to the accumulator.

Execution statuses: `'running'` | `'completed'` | `'failed'` | `'queued'` | `'stopped'`

---

## Concurrency and overlap (`job-concurrency.ts`)

Module-level mutable state (not DI — intentional, same-process singleton):
- `runningCount` — total currently-running jobs across all names
- `runningJobs: Set<string>` — job names currently in flight (for `noOverlap`)
- `queue: QueueEntry[]` — FIFO queue of jobs waiting for a slot
- `runningExecutions: Map<string, RunningExecution>` — for stop-by-ID
- `stoppedExecutions: Set<string>` — flag set when stop is requested mid-run

`drainQueue()` is called by `onJobEnd` every time a job slot frees up.

Stopping a **queued** execution removes it from `queue[]` and marks it `stopped` in storage immediately.  
Stopping a **running** execution adds its ID to `stoppedExecutions`. The decorator checks this flag in its `finally` block and skips the normal `completed`/`failed` update.

---

## `@TrackJob` decorator

Drop-in replacement for `@Cron`. Applies `Cron(cronTime, { name, ...restOptions })` after wrapping the method. The wrapper:

1. Checks `isOverlapping` — if yes, returns immediately (no storage write).
2. Checks `storage` — if null (not yet initialised), runs without recording.
3. Checks `isConcurrencyLimitReached` — if yes, saves as `'queued'` and returns.
4. Otherwise calls `runImmediately` — saves as `'running'`, runs, updates to `'completed'` or `'failed'`.

`options.noOverlap` on the decorator overrides the global `SchedulerDashContext.noOverlap`.

---

## Common pitfalls

| Pitfall | What happens | Fix |
|---|---|---|
| `setupSchedulerDash` called after `app.listen()` | Storage not ready when first cron fires; first executions unrecorded | Always call before `app.listen()` |
| Editing `dashboard.ts` directly | Next `pnpm build` overwrites it | Edit UI source in `scheduler-dash-ui/src/`, rebuild |
| Adding `basePath` back | Breaks hardcoded `/api` paths in UI | Don't — dashboard is port-isolated |
| New package alias not updated in `webpack.config.js` | Webpack can't resolve the import at compile time | Update both alias and externals check |
| `pnpm install` not run after package rename | Workspace symlink in `node_modules` points to old name | Run `pnpm install` from repo root |
| Custom `Storage` subclass not extending abstract base | `z.instanceof(Storage)` check in schema validation fails | Always extend `Storage` from `storage.abstract.ts` |

---

## Build commands

```bash
# From repo root:
pnpm install          # install all workspace deps + create symlinks
pnpm build            # build UI then compile library TypeScript
pnpm sample           # run sample NestJS app with watch (app: 3000, dash: 3636)
pnpm sample:build     # build library then build sample (webpack bundle)
pnpm dev              # watch-compile library TypeScript only
pnpm dev:ui           # Vite dev server for the UI (standalone, no NestJS)
```
