import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job33 {
  private readonly logger = new Logger(Job33.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-33' })
  run() {
    this.logger.log('Job33 running');
  }
}
