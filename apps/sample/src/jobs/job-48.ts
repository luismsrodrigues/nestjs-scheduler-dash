import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job48 {
  private readonly logger = new Logger(Job48.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-48' })
  run() {
    this.logger.log('Job48 running');
  }
}
