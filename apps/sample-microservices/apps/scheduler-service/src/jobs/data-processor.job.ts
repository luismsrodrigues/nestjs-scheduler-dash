import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';

@Injectable()
export class DataProcessorJob {
  private readonly logger = new Logger(DataProcessorJob.name);

  @TrackJob(CronExpression.EVERY_30_SECONDS, { name: 'data-processor' })
  async run() {
    this.logger.log('Processing data...');
    await new Promise(resolve => setTimeout(resolve, 2_000));
    this.logger.log('Data processing complete');
  }
}
