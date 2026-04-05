import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
<<<<<<< Updated upstream
import { TrackJob } from 'scheduler-dash';
=======
import { TrackJob } from '@luisrodrigues/nestjs-scheduler-dashboard';
>>>>>>> Stashed changes

@Injectable()
export class HourlyJob {
  private readonly logger = new Logger(HourlyJob.name);

  @TrackJob(CronExpression.EVERY_10_SECONDS, { name: 'hourly-job' })
  run() {
    this.logger.log('Hourly job running');
    throw new Error('Error in hourly job');
  }
}
