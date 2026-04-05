import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job47 {
  private readonly logger = new Logger(Job47.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-47' })
  run() {
    this.logger.log('Job47 running');
  }
}
