# sample-microservices

Demonstrates how to integrate `@luisrodrigues/nestjs-scheduler-dashboard` in a microservice architecture.

The setup consists of three independent services that communicate via [TSRPC](https://tsrpc.cn):

```
┌─────────────────────────────────────────────────────────────┐
│  Client (browser / curl)                                    │
│    GET /greet?name=X                                        │
│    GET /scheduler/stats                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP :3000
          ┌──────────▼──────────┐
          │      gateway        │  @sample-ms/gateway
          │   (NestJS HTTP)     │
          └───┬─────────────────┘
              │                        │
     TSRPC :4001               TSRPC :4002
              │                        │
   ┌──────────▼──────────┐   ┌─────────▼───────────────┐
   │   random-service    │   │    scheduler-service     │
   │  (pure TSRPC)       │   │  (NestJS + TSRPC)        │
   │                     │   │                          │
   │  Greet API          │   │  GetSchedulerStats API   │
   │                     │   │  @TrackJob cron          │
   │                     │   │  Dashboard :4003         │
   └─────────────────────┘   └──────────────────────────┘
```

| Service            | Package                      | Port(s)              |
|--------------------|------------------------------|----------------------|
| gateway            | `@sample-ms/gateway`         | HTTP :3000           |
| random-service     | `@sample-ms/random-service`  | TSRPC :4001          |
| scheduler-service  | `@sample-ms/scheduler-service` | TSRPC :4002, HTTP :4003 |
| Dashboard UI       | —                            | :4003/_scheduler     |

---

## Getting started

Install dependencies from inside this directory:

```bash
cd apps/sample-microservices
pnpm install
```

Start all services at once:

```bash
pnpm dev
```

Or start each service individually in separate terminals:

```bash
pnpm random-service    # TSRPC server on :4001
pnpm scheduler-service # NestJS + TSRPC on :4002/:4003
pnpm gateway           # NestJS HTTP on :3000
```

### Endpoints

```bash
# Gateway → random-service
curl "http://localhost:3000/greet?name=World"
# { "message": "Hello, World! — greetings from Random Service" }

# Gateway → scheduler-service
curl "http://localhost:3000/scheduler/stats"
# { "totalJobs": 1, "jobNames": ["data-processor"] }

# Scheduler dashboard (direct, no gateway)
open http://localhost:4003/_scheduler
# credentials: admin / admin (see .env.example)
```

---

## Integrating the dashboard into a microservice

`scheduler-service` shows the full integration pattern. These are the steps to replicate it in any NestJS microservice.

### 1. Add the dependency

```bash
pnpm add @luisrodrigues/nestjs-scheduler-dashboard @nestjs/schedule
```

### 2. Import the modules

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule, MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SchedulerDashModule.forRoot({
      route: '_scheduler',
      storage: new MemoryStorage({ historyRetention: 50 }),
      auth: {
        username: process.env.DASH_USER ?? 'admin',
        password: process.env.DASH_PASS ?? 'admin',
      },
    }),
  ],
})
export class AppModule {}
```

The dashboard is served at `/<route>` on the same port as the NestJS HTTP server. No separate process or port needed.

### 3. Track your jobs

Replace `@Cron` with `@TrackJob`. It accepts the same arguments:

```ts
// jobs/my-job.ts
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class MyJob {
  @TrackJob(CronExpression.EVERY_30_SECONDS, { name: 'my-job' })
  async run() {
    // job logic
  }
}
```

Register the job class as a provider in your module:

```ts
providers: [MyJob],
```

### 4. Start the NestJS app before the TSRPC server

If the microservice also exposes a TSRPC server (like `scheduler-service` does), boot NestJS first so the scheduler and dashboard middleware are registered before any RPC calls arrive:

```ts
// main.ts
const app = await NestFactory.create(AppModule);
await app.listen(HTTP_PORT);           // starts NestJS + registers jobs + mounts dashboard

const tsrpcServer = new HttpServer(serviceProto, { port: TSRPC_PORT, json: true });
tsrpcServer.implementApi('MyApi', async call => { /* ... */ });
await tsrpcServer.start();
```

### Options reference

| Option             | Type              | Default        | Description                                   |
|--------------------|-------------------|----------------|-----------------------------------------------|
| `route`            | `string`          | `_scheduler`   | URL prefix for the dashboard                  |
| `storage`          | `Storage`         | `MemoryStorage`| Where execution history is persisted          |
| `auth.username`    | `string`          | —              | HTTP Basic Auth username (omit to disable)    |
| `auth.password`    | `string`          | —              | HTTP Basic Auth password                      |
| `noOverlap`        | `boolean`         | `false`        | Skip a job if the previous run is still active |
| `maxConcurrent`    | `number`          | unlimited      | Max simultaneous job executions               |
| `historyRetention` | `number`          | `10`           | Execution records kept per job (MemoryStorage) |

---

## Workspace structure

```
apps/sample-microservices/
├── pnpm-workspace.yaml          inner workspace (packages/*, apps/*)
├── packages/
│   └── shared/                  TSRPC protocol types shared across services
│       └── src/
│           ├── service-a.proto.ts   Greet API schema
│           └── service-b.proto.ts   GetSchedulerStats API schema
└── apps/
    ├── gateway/                 NestJS HTTP — delegates to microservices via TSRPC clients
    ├── random-service/          Pure TSRPC server — no NestJS, no scheduler
    └── scheduler-service/       NestJS + TSRPC + @TrackJob + SchedulerDashModule
```

The shared TSRPC protocol types live in `packages/shared` and are referenced by all three services via tsconfig `paths`, so `ts-node` resolves them from source at runtime without a build step.
