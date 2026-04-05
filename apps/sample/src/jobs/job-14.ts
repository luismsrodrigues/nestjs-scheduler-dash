import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job14 {
  private readonly logger = new Logger(Job14.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-14' })
  run() {
    this.logger.log('Job14 running');
  }
}
