import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job20 {
  private readonly logger = new Logger(Job20.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-20' })
  run() {
    this.logger.log('Job20 running');
  }
}
