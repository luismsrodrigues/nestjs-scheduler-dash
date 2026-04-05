import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job21 {
  private readonly logger = new Logger(Job21.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-21' })
  run() {
    this.logger.log('Job21 running');
  }
}
