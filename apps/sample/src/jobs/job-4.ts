import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job4 {
  private readonly logger = new Logger(Job4.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-4' })
  run() {
    this.logger.log('Job4 running');
  }
}
