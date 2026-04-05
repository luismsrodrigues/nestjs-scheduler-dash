import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job29 {
  private readonly logger = new Logger(Job29.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-29' })
  run() {
    this.logger.log('Job29 running');
  }
}
