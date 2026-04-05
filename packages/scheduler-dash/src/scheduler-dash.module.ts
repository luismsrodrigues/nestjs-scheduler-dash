import { DynamicModule, Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsTrackerService } from './jobs-tracker.service';
import { BasicAuthGuard } from './basic-auth.guard';
import { SchedulerDashOptions, SCHEDULER_DASH_OPTIONS, SCHEDULER_DASH_STORAGE } from './scheduler-dash.options';

@Module({})
export class SchedulerDashModule {
  static forRoot(options: SchedulerDashOptions): DynamicModule {
    return {
      module: SchedulerDashModule,
      controllers: [JobsController],
      providers: [
        { provide: SCHEDULER_DASH_STORAGE, useValue: options.storage },
        { provide: SCHEDULER_DASH_OPTIONS, useValue: options },
        BasicAuthGuard,
        JobsService,
        JobsTrackerService,
      ],
    };
  }
}
