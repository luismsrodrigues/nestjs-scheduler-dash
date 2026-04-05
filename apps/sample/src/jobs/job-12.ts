import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job12 {
  private readonly logger = new Logger(Job12.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-12' })
  run() {
    this.logger.log('Job12 running');
  }
}
