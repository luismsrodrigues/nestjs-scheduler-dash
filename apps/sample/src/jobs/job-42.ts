import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job42 {
  private readonly logger = new Logger(Job42.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-42' })
  run() {
    this.logger.log('Job42 running');
  }
}
