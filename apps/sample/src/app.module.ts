import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HourlyJob } from './jobs/hourly.job';
import { Job1 } from './jobs/job-1';
import { Job2 } from './jobs/job-2';
import { Job3 } from './jobs/job-3';
import { Job4 } from './jobs/job-4';
import { Job5 } from './jobs/job-5';
import { Job6 } from './jobs/job-6';
import { Job7 } from './jobs/job-7';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [HourlyJob, Job1, Job2, Job3, Job4, Job5, Job6, Job7],
})
export class AppModule {}
