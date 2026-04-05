import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job22 {
  private readonly logger = new Logger(Job22.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-22' })
  run() {
    this.logger.log('Job22 running');
  }
}
