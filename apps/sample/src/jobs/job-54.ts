import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job54 {
  private readonly logger = new Logger(Job54.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-54' })
  run() {
    this.logger.log('Job54 running');
  }
}
