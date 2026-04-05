import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job32 {
  private readonly logger = new Logger(Job32.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-32' })
  run() {
    this.logger.log('Job32 running');
  }
}
