import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job28 {
  private readonly logger = new Logger(Job28.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-28' })
  run() {
    this.logger.log('Job28 running');
  }
}
