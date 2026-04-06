import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerDashModule, MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { HourlyJob } from './jobs/hourly.job';
import { Job1 } from './jobs/job-1';
import { Job2 } from './jobs/job-2';
import { Job3 } from './jobs/job-3';
import { Job4 } from './jobs/job-4';
import { Job5 } from './jobs/job-5';
import { Job6 } from './jobs/job-6';
import { Job7 } from './jobs/job-7';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SchedulerDashModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        route: config.get<string>('DASH_ROUTE', '_scheduler'),
        storage: new MemoryStorage({ historyRetention: 50 }),
        auth: {
          username: config.getOrThrow<string>('DASH_USER'),
          password: config.getOrThrow<string>('DASH_PASS'),
        },
      }),
    }),
  ],
  providers: [HourlyJob, Job1, Job2, Job3, Job4, Job5, Job6, Job7],
})
export class AppModule {}
