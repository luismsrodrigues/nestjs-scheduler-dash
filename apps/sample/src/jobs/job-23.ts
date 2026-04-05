import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job23 {
  private readonly logger = new Logger(Job23.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-23' })
  run() {
    this.logger.log('Job23 running');
  }
}
