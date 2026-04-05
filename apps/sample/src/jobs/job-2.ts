import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job2 {
  private readonly logger = new Logger(Job2.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-2' })
  run() {
    this.logger.log('Job2 running');
    throw new Error('Job2 error');
  }
}
