import { Module, DynamicModule, Inject, OnModuleInit } from '@nestjs/common';
import { Storage } from './storage/storage.abstract';
import { MemoryStorage } from './storage/memory.storage';
import { SchedulerDashContext } from './scheduler-dash.context';
import { SchedulerDashOptions } from './scheduler-dash.options';

const STORAGE_TOKEN = Symbol('DASHBOARD_STORAGE');
const OPTIONS_TOKEN  = Symbol('DASHBOARD_OPTIONS');

@Module({})
export class DashboardModule implements OnModuleInit {
  constructor(
    @Inject(STORAGE_TOKEN) private readonly storage: Storage,
    @Inject(OPTIONS_TOKEN)  private readonly options: SchedulerDashOptions,
  ) {}

  onModuleInit(): void {
    // Wire the shared globalThis context so @TrackJob (which may come from a
    // different module instance) always writes to the same storage.
    SchedulerDashContext.storage      = this.storage;
    SchedulerDashContext.noOverlap    = this.options.noOverlap    ?? false;
    SchedulerDashContext.maxConcurrent = this.options.maxConcurrent;
  }

  static forRoot(options: SchedulerDashOptions = {}): DynamicModule {
    const storage = options.storage ?? new MemoryStorage({ historyRetention: 10 });
    return {
      module: DashboardModule,
      providers: [
        { provide: STORAGE_TOKEN, useValue: storage },
        { provide: OPTIONS_TOKEN,  useValue: options },
      ],
    };
  }
}
