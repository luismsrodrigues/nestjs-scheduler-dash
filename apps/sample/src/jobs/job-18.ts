import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job18 {
  private readonly logger = new Logger(Job18.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-18' })
  run() {
    this.logger.log('Job18 running');
  }
}
