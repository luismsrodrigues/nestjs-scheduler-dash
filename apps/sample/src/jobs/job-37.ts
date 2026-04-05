import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job37 {
  private readonly logger = new Logger(Job37.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-37' })
  run() {
    this.logger.log('Job37 running');
  }
}
