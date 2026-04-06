# @luisrodrigues/nestjs-scheduler-dashboard

A plug-and-play dashboard for [`@nestjs/schedule`](https://docs.nestjs.com/techniques/task-scheduling). Visualize cron job executions, track history and metrics, trigger jobs manually, and stop running executions — all from an embedded UI served on your existing application port.

---

## Features

- Mounted directly on your app — no separate port or process
- Execution history per job with status, duration, and error details
- Persistent metrics: total runs, failed runs, average duration — independent of history retention
- Manual job triggering and execution stop from the UI
- Concurrency control: limit how many jobs run simultaneously, with automatic queuing
- No-overlap mode: skip a job if it is already running
- Optional HTTP Basic Auth to protect the dashboard
- Light / dark mode

---

## Installation

```bash
npm install @luisrodrigues/nestjs-scheduler-dashboard
# or
pnpm add @luisrodrigues/nestjs-scheduler-dashboard
```

**Peer dependencies** (install if not already present):

```bash
npm install @nestjs/common @nestjs/core @nestjs/schedule express
```

---

## Quick start

### 1. Import `SchedulerDashModule` in your `AppModule`

```ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SchedulerDashModule.forRoot({ route: '_scheduler' }),
  ],
})
export class AppModule {}
```

### 2. Replace `@Cron` with `@TrackJob` on every job

`@TrackJob` is a wrapper around NestJS's `@Cron` decorator. It registers the cron schedule exactly as `@Cron` does, and additionally records every execution (start time, duration, status, errors) so the dashboard can display them.

> **Jobs decorated with `@Cron` instead of `@TrackJob` will still run on schedule but will not appear in the dashboard history.**

```ts
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class ReportJob {
  // Before: @Cron(CronExpression.EVERY_HOUR)
  @TrackJob(CronExpression.EVERY_HOUR, { name: 'generate-report' })
  async run() {
    // your job logic — no other changes needed
  }
}
```

That's it. Start your app and open `http://localhost:3000/_scheduler`.

---

## Configuration

`SchedulerDashModule.forRoot(options?)` accepts:

| Option | Type | Default | Description |
|---|---|---|---|
| `route` | `string` | `'_scheduler'` | URL path where the dashboard is mounted |
| `storage` | `Storage` | `new MemoryStorage()` | Storage backend for execution history and metrics |
| `maxConcurrent` | `number` | — | Maximum number of jobs that can run simultaneously. Excess jobs are queued |
| `noOverlap` | `boolean` | `false` | Globally prevent a job from starting if it is already running |
| `auth` | `{ username, password }` | — | Protect the dashboard with HTTP Basic Auth |

### `route`

The URL path where the dashboard is served, relative to your app's root.

```ts
SchedulerDashModule.forRoot({ route: 'admin/scheduler' })
// dashboard → http://localhost:3000/admin/scheduler
```

### `storage`

The default `MemoryStorage` keeps everything in-process. You can limit how many history entries are kept per job:

```ts
import { MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';

SchedulerDashModule.forRoot({
  storage: new MemoryStorage({
    historyRetention: 50, // keep the last 50 executions per job (default: unlimited)
  }),
})
```

> **Metrics are independent of `historyRetention`.** Even after old history entries are trimmed, the counters for total runs, failed runs, and average duration keep accumulating.

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

### `maxConcurrent`

Limits how many `@TrackJob` jobs can run simultaneously across the entire application. Jobs that exceed the limit are saved to storage with status `"queued"` and run in FIFO order as slots free up.

```ts
SchedulerDashModule.forRoot({ maxConcurrent: 5 })
```

### `noOverlap`

Prevents a job from firing again if it is still running. Applies globally to all `@TrackJob` methods.

```ts
SchedulerDashModule.forRoot({ noOverlap: true })
```

Can also be overridden per job via the decorator:

```ts
@TrackJob(CronExpression.EVERY_MINUTE, { name: 'sync', noOverlap: true })
async sync() { /* ... */ }
```

### `auth`

```ts
SchedulerDashModule.forRoot({
  auth: {
    username: process.env.DASH_USER ?? 'admin',
    password: process.env.DASH_PASS ?? 'secret',
  },
})
```

---

## `@TrackJob` decorator

`@TrackJob` is a **wrapper around `@Cron`** from `@nestjs/schedule`. It accepts every argument that `@Cron` accepts and passes them through unchanged, so migrating an existing job is a one-line change. The only addition is the `noOverlap` option and the automatic execution tracking.

**Every scheduled job must use `@TrackJob` instead of `@Cron`.** Jobs that remain on `@Cron` will run normally but their executions will not be recorded or visible in the dashboard.

```ts
@TrackJob(cronTime, options?)
```

| Argument | Type | Description |
|---|---|---|
| `cronTime` | `string \| CronExpression` | Cron expression or `CronExpression` enum value |
| `options.name` | `string` | Job name shown in the dashboard. Defaults to `ClassName.methodName` |
| `options.noOverlap` | `boolean` | Skip this job if it is already running. Overrides the global setting |
| `options.*` | — | All other [`CronOptions`](https://docs.nestjs.com/techniques/task-scheduling) are passed through |

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

## API

The dashboard exposes a small REST API under the configured route.

| Method | Path | Description |
|---|---|---|
| `GET` | `/<route>/api` | Returns all jobs with history and metrics |
| `GET` | `/<route>/api/:name` | Returns a single job with history and metrics |
| `POST` | `/<route>/api/:name/trigger` | Manually trigger a cron job by name |
| `POST` | `/<route>/api/executions/:id/stop` | Stop a running or queued execution by ID |

---

## Full example

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule, MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { ReportJob } from './jobs/report.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SchedulerDashModule.forRoot({
      route: '_scheduler',
      storage: new MemoryStorage({ historyRetention: 100 }),
      maxConcurrent: 3,
      noOverlap: true,
      auth: {
        username: process.env.DASH_USER ?? 'admin',
        password: process.env.DASH_PASS ?? 'secret',
      },
    }),
  ],
  providers: [ReportJob],
})
export class AppModule {}
```

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  // Dashboard at http://localhost:3000/_scheduler
}

bootstrap();
```

---

## License

MIT
