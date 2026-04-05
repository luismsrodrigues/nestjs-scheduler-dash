import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-toolkit/scheduler-dash';

@Injectable()
export class Job46 {
  private readonly logger = new Logger(Job46.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-46' })
  run() {
    this.logger.log('Job46 running');
  }
}
