import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job52 {
  private readonly logger = new Logger(Job52.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-52' })
  run() {
    this.logger.log('Job52 running');
  }
}
