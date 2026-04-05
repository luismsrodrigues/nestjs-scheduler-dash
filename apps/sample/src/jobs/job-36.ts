import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job36 {
  private readonly logger = new Logger(Job36.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-36' })
  run() {
    this.logger.log('Job36 running');
  }
}
