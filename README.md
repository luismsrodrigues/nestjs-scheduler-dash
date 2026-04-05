# nestjs-scheduler-dashboard

Monorepo for `@luisrodrigues/nestjs-scheduler-dashboard` — a plug-and-play dashboard for [`@nestjs/schedule`](https://docs.nestjs.com/techniques/task-scheduling).

---

## Preview

**Dashboard - Jobs List**
![Dashboard Jobs List](./1.jpg)

**Job Detail - Execution History**
![Job Detail](./2.jpg)

---

## Packages

| Package | Description |
|---|---|
| [`packages/scheduler-dash`](./packages/scheduler-dash) | The publishable library — `setupSchedulerDash`, `@TrackJob`, storage abstractions |
| [`packages/scheduler-dash-ui`](./packages/scheduler-dash-ui) | React + Tailwind UI, built into a single HTML file embedded in the library |
| [`apps/sample`](./apps/sample) | NestJS sample app demonstrating the library in action |

---

## Getting started (library users)

See the [package README](./packages/scheduler-dash/README.md) for full documentation.

```bash
npm install @luisrodrigues/nestjs-scheduler-dashboard
```

```ts
// app.module.ts
import { SchedulerDashModule } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Module({
  imports: [SchedulerDashModule.forRoot({ route: '/scheduler' })],
})
export class AppModule {}
```

```ts
// main.ts
import { initializeSchedulerDash } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { SchedulerRegistry } from '@nestjs/schedule';

const schedulerRegistry = app.get(SchedulerRegistry);
initializeSchedulerDash(schedulerRegistry, {});
```

```ts
// any job class
@TrackJob(CronExpression.EVERY_HOUR, { name: 'my-job' })
async run() { /* ... */ }
```

Access the dashboard at `http://localhost:3000/scheduler`

---

## Development

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
pnpm install
```

### Common commands

| Command | Description |
|---|---|
| `pnpm build` | Build the library (also rebuilds the UI) |
| `pnpm dev` | Watch-compile the library TypeScript |
| `pnpm dev:ui` | Start the UI in Vite dev mode |
| `pnpm sample` | Run the sample NestJS app (with watch) |
| `pnpm sample:build` | Build the library then build the sample app |

### Workspace structure

```
nestjs-scheduler-dashboard/
├── apps/
│   └── sample/          # NestJS sample app
├── packages/
│   ├── scheduler-dash/  # Library source (TypeScript)
│   └── scheduler-dash-ui/  # React UI (Vite)
├── package.json
└── pnpm-workspace.yaml
```

### Making UI changes

The UI lives in `packages/scheduler-dash-ui`. After editing:

```bash
pnpm build
```

This rebuilds the UI and outputs it to `packages/scheduler-dash/ui/`, which is served by the module.

### Running the sample

```bash
pnpm sample
```

- App: `http://localhost:3000`
- Dashboard: `http://localhost:3000/scheduler`

The sample app registers several cron jobs decorated with `@TrackJob`. Click **Trigger** on any job to fire it immediately and see history populate.

---

## How it works

1. `SchedulerDashModule.forRoot({ route: '/scheduler' })` creates a global NestJS module that sets up the dashboard middleware.
2. `initializeSchedulerDash(registry, options)` wires the `SchedulerRegistry` and storage into a `globalThis` singleton (`SchedulerDashContext`).
3. `@TrackJob` reads `SchedulerDashContext` at runtime to record executions. Because storage is in `globalThis`, it is shared correctly even when pnpm resolves the package to multiple module instances.
4. The dashboard serves a self-contained HTML dashboard and a REST API (`/api`, `/api/:name`, `/api/:name/trigger`, `/api/executions/:id/stop`) on the same port as the host app.

---

## License

MIT
