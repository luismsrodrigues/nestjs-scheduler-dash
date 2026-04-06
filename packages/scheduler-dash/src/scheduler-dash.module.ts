import {
  Module,
  DynamicModule,
  Inject,
  OnModuleInit,
  Logger,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import { Storage } from './storage/storage.abstract';
import { MemoryStorage } from './storage/memory.storage';
import { SchedulerDashContext } from './scheduler-dash.context';
import { SchedulerDashOptions, SchedulerDashAsyncOptions } from './scheduler-dash.options';
import { SchedulerDashOptionsSchema } from './scheduler-dash.schema';
import { JobsService } from './jobs.service';
import { createAuthGuard } from './auth';
import { STORAGE_TOKEN, OPTIONS_TOKEN } from './scheduler-dash.constants';

const PUBLIC_PATH = join(__dirname, 'public');

@Module({})
export class SchedulerDashModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger('SchedulerDash', { timestamp: true });

  constructor(
    @Inject(OPTIONS_TOKEN) private readonly options: SchedulerDashOptions,
    @Inject(STORAGE_TOKEN) private readonly storage: Storage,
    private readonly jobsService: JobsService,
  ) {}

  onModuleInit(): void {
    SchedulerDashContext.storage = this.storage;
    SchedulerDashContext.noOverlap = this.options.noOverlap ?? false;
    SchedulerDashContext.maxConcurrent = this.options.maxConcurrent;

    const route = this.normalizeRoute(this.options.route);
    this.logger.log(`Dashboard available at /${route}`);
  }

  configure(consumer: MiddlewareConsumer): void {
    const route = this.normalizeRoute(this.options.route);
    const guard = createAuthGuard(this.options.auth);
    const svc = this.jobsService;

    const router = express.Router({ mergeParams: true });

    router.use(guard);

    router.use(express.static(PUBLIC_PATH));

    router.get('/api', (_req, res) => {
      try {
        res.json(svc.getJobs());
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    });

    router.get('/api/:name', (req, res) => {
      const job = svc.getJob(req.params.name);
      job
        ? res.json(job)
        : res.status(404).json({ message: `Job "${req.params.name}" not found` });
    });

    router.post('/api/:name/trigger', (req, res) => {
      const ok = svc.triggerJob(req.params.name);
      ok
        ? res.json({ triggered: req.params.name })
        : res.status(404).json({ message: `Job "${req.params.name}" not found` });
    });

    router.post('/api/executions/:id/stop', (req, res) => {
      const ok = svc.stopExecution(req.params.id);
      ok
        ? res.json({ stopped: req.params.id })
        : res.status(404).json({
            message: `Execution "${req.params.id}" not found or already finished`,
          });
    });

    router.use((_req, res) => {
      res.sendFile('index.html', { root: PUBLIC_PATH });
    });

    // Silently absorb browser-generated noise requests so they never reach
    // NestJS's exception filter and pollute error logs.
    const BROWSER_NOISE = [
      '/favicon.ico',
      '/.well-known/appspecific/com.chrome.devtools.json',
    ];

    consumer
      .apply((req: any, res: any, next: any) => {
        if (BROWSER_NOISE.includes(req.path)) {
          res.status(204).end();
          return;
        }
        next();
      })
      .forRoutes('/');

    consumer
      .apply((req: any, res: any, next: any) => {
        req.url =
          req.originalUrl.replace(new RegExp(`^/${this.escapeRegex(route)}(?=/|$)`), '') || '/';

        router(req, res, next);
      })
      .forRoutes(route);
  }

  static forRoot(options: SchedulerDashOptions = {}): DynamicModule {
    const parsed = SchedulerDashOptionsSchema.safeParse(options);

    if (!parsed.success) {
      throw new Error(
        `[SchedulerDash] Invalid options:\n${parsed.error.issues
          .map(i => `  • ${i.path.join('.')}: ${i.message}`)
          .join('\n')}`,
      );
    }

    return {
      module: SchedulerDashModule,
      providers: [
        { provide: OPTIONS_TOKEN, useValue: options },
        {
          provide: STORAGE_TOKEN,
          useFactory: (opts: SchedulerDashOptions) =>
            opts.storage ?? new MemoryStorage({ historyRetention: 10 }),
          inject: [OPTIONS_TOKEN],
        },
        JobsService,
      ],
    };
  }

  static forRootAsync(asyncOptions: SchedulerDashAsyncOptions): DynamicModule {
    return {
      module: SchedulerDashModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: OPTIONS_TOKEN,
          useFactory: async (...args: any[]) => {
            const options = await asyncOptions.useFactory(...args);
            const parsed = SchedulerDashOptionsSchema.safeParse(options);

            if (!parsed.success) {
              throw new Error(
                `[SchedulerDash] Invalid options:\n${parsed.error.issues
                  .map(i => `  • ${i.path.join('.')}: ${i.message}`)
                  .join('\n')}`,
              );
            }

            return options;
          },
          inject: asyncOptions.inject ?? [],
        },
        {
          provide: STORAGE_TOKEN,
          useFactory: (opts: SchedulerDashOptions) =>
            opts.storage ?? new MemoryStorage({ historyRetention: 10 }),
          inject: [OPTIONS_TOKEN],
        },
        JobsService,
      ],
    };
  }

  private normalizeRoute(route?: string): string {
    return (route ?? '_scheduler').replace(/^\/+|\/+$/g, '');
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}