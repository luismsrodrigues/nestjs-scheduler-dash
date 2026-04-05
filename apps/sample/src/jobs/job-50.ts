import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job50 {
  private readonly logger = new Logger(Job50.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-50' })
  run() {
    this.logger.log('Job50 running');
  }
}
