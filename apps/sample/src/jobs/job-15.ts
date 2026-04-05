import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job15 {
  private readonly logger = new Logger(Job15.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-15' })
  run() {
    this.logger.log('Job15 running');
  }
}
