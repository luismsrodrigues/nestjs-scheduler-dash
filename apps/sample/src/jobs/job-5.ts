import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class Job5 {
  private readonly logger = new Logger(Job5.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-5' })
  run() {
    this.logger.log('Job5 running');
  }
}
