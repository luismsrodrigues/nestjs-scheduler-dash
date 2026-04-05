import { Module, Global, DynamicModule, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerRegistry } from '@nestjs/schedule';
import { StorageService } from './storage.service';
import { SchedulerDashService } from './scheduler-dash.service';
import { setSchedulerDashService } from './scheduler-dash.bridge';
import { MemoryStorage } from './storage/memory.storage';
import { SchedulerDashOptions } from './scheduler-dash.options';
import { SchedulerDashOptionsSchema } from './scheduler-dash.schema';
import { stopExecutionById } from './decorators/job-concurrency';

export interface SchedulerDashCoreModuleOptions extends SchedulerDashOptions {
  historyRetention?: number;
}

@Global()
@Module({
  providers: [StorageService, SchedulerDashService],
})
export class SchedulerDashCoreModule implements OnModuleInit {
  constructor(
    private readonly storageService: StorageService,
    private readonly schedulerDashService: SchedulerDashService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    setSchedulerDashService(this.schedulerDashService);
    this.schedulerDashService.storage = this.storageService;
  }

  getJobs() {
    const cron = [...this.schedulerRegistry.getCronJobs().entries()].map(([name, job]) => ({
      name,
      cronExpression: (job.cronTime as any).source?.toString() ?? null,
      running: job.running ?? false,
      nextRun: job.nextDate().toISO(),
      history: this.storageService.findByJob(name),
      metrics: this.storageService.getMetrics(name),
    }));

    const intervals = this.schedulerRegistry.getIntervals().map((name) => ({ name }));
    const timeouts = this.schedulerRegistry.getTimeouts().map((name) => ({ name }));

    return { cron, intervals, timeouts };
  }

  triggerJob(name: string): boolean {
    const job = this.schedulerRegistry.getCronJobs().get(name);
    if (!job) return false;
    job.fireOnTick();
    return true;
  }

  stopExecution(executionId: string): boolean {
    return stopExecutionById(executionId);
  }

  static forRoot(options: SchedulerDashCoreModuleOptions = {}): DynamicModule {
    const parsed = SchedulerDashOptionsSchema.safeParse(options);
    if (!parsed.success) {
      throw new Error(
        `[SchedulerDash] Invalid options:\n${parsed.error.issues.map(i => `  • ${i.path.join('.')}: ${i.message}`).join('\n')}`,
      );
    }

    const storage = new MemoryStorage({ historyRetention: options.historyRetention ?? 10 });

    return {
      module: SchedulerDashCoreModule,
      imports: [ScheduleModule.forRoot()],
      providers: [
        { provide: 'SCHEDULER_DASH_STORAGE', useValue: storage },
      ],
    };
  }
}
