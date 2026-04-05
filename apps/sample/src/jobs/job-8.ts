import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job8 {
  private readonly logger = new Logger(Job8.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-8' })
  run() {
    this.logger.log('Job8 running');
  }
}
