import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job27 {
  private readonly logger = new Logger(Job27.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-27' })
  run() {
    this.logger.log('Job27 running');
  }
}
