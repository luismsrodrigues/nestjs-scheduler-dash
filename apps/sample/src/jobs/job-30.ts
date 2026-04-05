import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job30 {
  private readonly logger = new Logger(Job30.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-30' })
  run() {
    this.logger.log('Job30 running');
  }
}
