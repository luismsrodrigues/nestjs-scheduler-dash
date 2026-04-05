import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job41 {
  private readonly logger = new Logger(Job41.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-41' })
  run() {
    this.logger.log('Job41 running');
  }
}
