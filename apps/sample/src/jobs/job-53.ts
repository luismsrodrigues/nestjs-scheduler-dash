import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job53 {
  private readonly logger = new Logger(Job53.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-53' })
  run() {
    this.logger.log('Job53 running');
  }
}
