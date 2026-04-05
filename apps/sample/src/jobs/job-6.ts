import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class Job6 {
  private readonly logger = new Logger(Job6.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-6' })
  run() {
    this.logger.log('Job6 running');
  }
}
