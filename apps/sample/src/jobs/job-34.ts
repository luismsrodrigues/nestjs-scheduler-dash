import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job34 {
  private readonly logger = new Logger(Job34.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-34' })
  run() {
    this.logger.log('Job34 running');
  }
}
