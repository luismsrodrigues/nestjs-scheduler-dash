import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job16 {
  private readonly logger = new Logger(Job16.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-16' })
  run() {
    this.logger.log('Job16 running');
  }
}
