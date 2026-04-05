import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job40 {
  private readonly logger = new Logger(Job40.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-40' })
  run() {
    this.logger.log('Job40 running');
  }
}
