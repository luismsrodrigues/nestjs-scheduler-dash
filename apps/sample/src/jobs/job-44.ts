import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job44 {
  private readonly logger = new Logger(Job44.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-44' })
  run() {
    this.logger.log('Job44 running');
  }
}
