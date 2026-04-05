# nestjs-scheduler-dashboard

Monorepo for `@luisrodrigues/nestjs-scheduler-dashboard` — a plug-and-play dashboard for [`@nestjs/schedule`](https://docs.nestjs.com/techniques/task-scheduling).

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
// main.ts
await setupSchedulerDash(app, { port: 3636 });
await app.listen(3000);
// Dashboard → http://localhost:3636
```

```ts
// any job class
@TrackJob(CronExpression.EVERY_HOUR, { name: 'my-job' })
async run() { /* ... */ }
```

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

This rebuilds the UI and inlines it as `packages/scheduler-dash/src/ui/dashboard.ts`, which is imported by the standalone server.

### Running the sample

```bash
pnpm sample
```

- App: `http://localhost:3000`
- Dashboard: `http://localhost:3636`

The sample app registers several cron jobs decorated with `@TrackJob`. Click **Trigger** on any job to fire it immediately and see history populate.

---

## How it works

1. `setupSchedulerDash(app, options)` creates an internal NestJS application context (`NestFactory.createApplicationContext`) that initialises storage and wires it into a `globalThis` singleton (`SchedulerDashContext`).
2. `@TrackJob` reads `SchedulerDashContext.storage` at runtime to record executions. Because storage is in `globalThis`, it is shared correctly even when pnpm resolves the package to multiple module instances.
3. A plain Node.js HTTP server starts on the configured port and serves the self-contained dashboard HTML and a small REST API (`/api`, `/api/:name/trigger`, `/api/executions/:id/stop`).

---

## License

MIT
