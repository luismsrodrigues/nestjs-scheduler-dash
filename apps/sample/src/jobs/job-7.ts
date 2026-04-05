import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job7 {
  private readonly logger = new Logger(Job7.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-7' })
  run() {
    this.logger.log('Job7 running');
  }
}
