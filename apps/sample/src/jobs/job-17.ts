import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job17 {
  private readonly logger = new Logger(Job17.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-17' })
  run() {
    this.logger.log('Job17 running');
  }
}
