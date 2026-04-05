import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job45 {
  private readonly logger = new Logger(Job45.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-45' })
  run() {
    this.logger.log('Job45 running');
  }
}
