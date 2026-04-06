import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class Job7 {
  private readonly logger = new Logger(Job7.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-7', disabled: true })
  run() {
    this.logger.log('Job7 running');
  }
}
