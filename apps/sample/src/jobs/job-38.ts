import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job38 {
  private readonly logger = new Logger(Job38.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-38' })
  run() {
    this.logger.log('Job38 running');
  }
}
