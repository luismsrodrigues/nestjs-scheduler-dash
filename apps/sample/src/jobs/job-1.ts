import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/scheduler-dash';

@Injectable()
export class Job1 {
  private readonly logger = new Logger(Job1.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-1' })
  async run() {
    this.logger.log('Job1 running');
    await new Promise(resolve => setTimeout(resolve, 30_000));
  }
}
