import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule, MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { DataProcessorJob } from './jobs/data-processor.job';
import { StatsService } from './stats.service';

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
  providers: [DataProcessorJob, StatsService],
  exports: [StatsService],
})
export class ServiceBModule {}
