import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job9 {
  private readonly logger = new Logger(Job9.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-9' })
  run() {
    this.logger.log('Job9 running');
  }
}
