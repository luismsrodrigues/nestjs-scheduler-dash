import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job55 {
  private readonly logger = new Logger(Job55.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-55' })
  run() {
    this.logger.log('Job55 running');
  }
}
