import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job10 {
  private readonly logger = new Logger(Job10.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-10' })
  run() {
    this.logger.log('Job10 running');
  }
}
