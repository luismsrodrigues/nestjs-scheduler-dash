# @luisrodrigues/nestjs-scheduler-dashboard

A plug-and-play dashboard for [`@nestjs/schedule`](https://docs.nestjs.com/techniques/task-scheduling). Visualize cron job executions, track history and metrics, trigger jobs manually, and stop running executions — all from an embedded UI with zero external dependencies.

---

## Features

- Embedded UI served directly from your NestJS app (no separate frontend server)
- Execution history per job with status, duration, and error details
- Persistent metrics: total runs, failed runs, average duration — independent of history retention
- Manual job triggering and execution stop from the UI
- Concurrency control: limit how many jobs run simultaneously with a queue
- No-overlap mode: skip or queue a job if it is already running
- Optional HTTP Basic Auth to protect the dashboard
- Light / dark mode
- Standalone server mode (separate port) or embedded in your existing app

---

## Installation

```bash
npm install @luisrodrigues/nestjs-scheduler-dashboard
# or
pnpm add @luisrodrigues/nestjs-scheduler-dashboard
```

**Peer dependencies** (install if not already present):

```bash
npm install @nestjs/common @nestjs/schedule
```

---

## Quick start

### 1. Initialize the dashboard in `main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSchedulerDash } from '@luisrodrigues/nestjs-scheduler-dashboard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app);

  await app.listen(3000);
}

bootstrap();
```

The dashboard is now available at `http://localhost:3000/_jobs`.

### 2. Decorate your jobs

Replace `@Cron` with `@TrackJob` — it accepts the same arguments:

```ts
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class ReportJob {
  @TrackJob(CronExpression.EVERY_HOUR, { name: 'generate-report' })
  async run() {
    // your job logic
  }
}
```

---

## Configuration

`setupSchedulerDash(app, options?)` accepts the following options:

| Option | Type | Default | Description |
|---|---|---|---|
| `storage` | `Storage` | `new MemoryStorage()` | Storage backend for execution history and metrics |
| `basePath` | `string` | `'_jobs'` | URL path where the dashboard is mounted |
| `port` | `number` | — | When set, serves the dashboard on a separate HTTP server instead of mounting on the main app |
| `maxConcurrent` | `number` | — | Maximum number of `@TrackJob` jobs that can run at the same time. Excess jobs are queued |
| `noOverlap` | `boolean` | `false` | Globally prevent a job from starting if it is already running |
| `auth` | `{ username, password }` | — | Protect all dashboard routes with HTTP Basic Auth |

### `storage`

The storage backend persists execution history and metrics. The built-in `MemoryStorage` keeps everything in-process.

```ts
import { MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';

await setupSchedulerDash(app, {
  storage: new MemoryStorage({
    historyRetention: 50, // keep the last 50 executions per job (default: unlimited)
  }),
});
```

> **Metrics are independent of `historyRetention`.** Even if old history entries are removed, the counters for total runs, failed runs, and average duration keep accumulating.

To use a custom storage backend, extend the abstract `Storage` class:

```ts
import { Storage, IStorageOptions, JobExecution, JobMetrics } from '@luisrodrigues/nestjs-scheduler-dashboard';

export class RedisStorage extends Storage {
  constructor(options: IStorageOptions = {}) {
    super(options);
  }

  save(execution: JobExecution): void { /* ... */ }
  update(id: string, data: Partial<Pick<JobExecution, 'finishedAt' | 'status' | 'error'>>): void { /* ... */ }
  findByJob(jobName: string): JobExecution[] { /* ... */ }
  findAll(): Record<string, JobExecution[]> { /* ... */ }
  getMetrics(jobName: string): JobMetrics { /* ... */ }
  getAllMetrics(): Record<string, JobMetrics> { /* ... */ }
}
```

### `basePath`

Changes the URL where the dashboard is served. Must contain only alphanumeric characters, hyphens, underscores, or slashes.

```ts
await setupSchedulerDash(app, {
  basePath: 'admin/scheduler',
  // dashboard → http://localhost:3000/admin/scheduler
});
```

### `port`

Serve the dashboard on a completely separate HTTP server, isolated from your main application.

```ts
await setupSchedulerDash(app, {
  port: 3001,
  // dashboard → http://localhost:3001/_jobs
  // main app  → http://localhost:3000
});
```

### `maxConcurrent`

Limits the total number of `@TrackJob` jobs that can execute simultaneously across your entire application. Jobs that cannot start immediately are saved to storage with status `"queued"` and run in FIFO order as slots free up.

```ts
await setupSchedulerDash(app, {
  maxConcurrent: 5, // at most 5 jobs running at the same time
});
```

### `noOverlap`

Prevents a job from firing again if the same job is still running. Applies globally to all `@TrackJob`-decorated methods.

```ts
await setupSchedulerDash(app, {
  noOverlap: true,
});
```

Can also be set per job via the decorator, which takes precedence over the global setting:

```ts
@TrackJob(CronExpression.EVERY_MINUTE, { name: 'sync', noOverlap: true })
async sync() { /* ... */ }
```

### `auth`

Protect the dashboard with HTTP Basic Auth.

```ts
await setupSchedulerDash(app, {
  auth: {
    username: 'admin',
    password: 'supersecret',
  },
});
```

---

## `@TrackJob` decorator

`@TrackJob` is a drop-in replacement for `@Cron` from `@nestjs/schedule`. It accepts all the same options plus `noOverlap`.

```ts
@TrackJob(cronTime, options?)
```

| Argument | Type | Description |
|---|---|---|
| `cronTime` | `string \| CronExpression` | Cron expression or `CronExpression` enum value |
| `options.name` | `string` | Human-readable job name shown in the dashboard. Defaults to `ClassName.methodName` |
| `options.noOverlap` | `boolean` | Skip this job if it is already running. Overrides the global `noOverlap` setting |
| `options.*` | — | All other [`CronOptions`](https://docs.nestjs.com/techniques/task-scheduling) from `@nestjs/schedule` are passed through |

```ts
@TrackJob('0 */6 * * *', {
  name: 'cleanup-old-records',
  noOverlap: true,
  timeZone: 'Europe/Lisbon',
})
async cleanup() {
  // runs every 6 hours, skipped if previous run is still in progress
}
```

---

## Full configuration example

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  setupSchedulerDash,
  MemoryStorage,
} from '@luisrodrigues/nestjs-scheduler-dashboard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app, {
    storage: new MemoryStorage({ historyRetention: 100 }),
    basePath: 'scheduler',
    maxConcurrent: 3,
    noOverlap: true,
    auth: {
      username: process.env.DASH_USER ?? 'admin',
      password: process.env.DASH_PASS ?? 'secret',
    },
  });

  await app.listen(3000);
}

bootstrap();
```

---

## API

The dashboard exposes a small REST API used by the UI. You can also call it directly.

| Method | Path | Description |
|---|---|---|
| `GET` | `/{basePath}/api` | Returns all jobs with history and metrics |
| `POST` | `/{basePath}/api/:name/trigger` | Manually trigger a cron job by name |
| `POST` | `/{basePath}/api/executions/:id/stop` | Stop a running or queued execution by ID |

---

## License

MIT
