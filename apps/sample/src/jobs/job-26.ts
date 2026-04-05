import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job26 {
  private readonly logger = new Logger(Job26.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-26' })
  run() {
    this.logger.log('Job26 running');
  }
}
