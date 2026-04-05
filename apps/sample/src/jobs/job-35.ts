import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job35 {
  private readonly logger = new Logger(Job35.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-35' })
  run() {
    this.logger.log('Job35 running');
  }
}
