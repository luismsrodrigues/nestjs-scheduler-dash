import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job13 {
  private readonly logger = new Logger(Job13.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-13' })
  run() {
    this.logger.log('Job13 running');
  }
}
