import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job49 {
  private readonly logger = new Logger(Job49.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-49' })
  run() {
    this.logger.log('Job49 running');
  }
}
