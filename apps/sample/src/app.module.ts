import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule, MemoryStorage } from 'scheduler-dash';
import { HourlyJob } from './jobs/hourly.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SchedulerDashModule.forRoot({
      storage: new MemoryStorage({ maxExecutions:5 }),
    }),
  ],
  providers: [HourlyJob],
})
export class AppModule {}
