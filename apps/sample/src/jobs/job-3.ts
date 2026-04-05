import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job3 {
  private readonly logger = new Logger(Job3.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-3' })
  run() {
    this.logger.log('Job3 running');
  }
}
