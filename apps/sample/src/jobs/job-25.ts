import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job25 {
  private readonly logger = new Logger(Job25.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-25' })
  run() {
    this.logger.log('Job25 running');
  }
}
