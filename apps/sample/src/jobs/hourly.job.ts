import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class HourlyJob {
  private readonly logger = new Logger(HourlyJob.name);

  @TrackJob(CronExpression.EVERY_6_HOURS, { name: 'hourly-job' })
  run() {
    this.logger.log('Hourly job running');
  }
}
