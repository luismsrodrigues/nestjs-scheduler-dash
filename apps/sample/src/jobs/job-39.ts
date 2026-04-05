import { Injectable, Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { TrackJob } from '@nestjs-scheduler-dash/dashboard';

@Injectable()
export class Job39 {
  private readonly logger = new Logger(Job39.name);

  @TrackJob(CronExpression.EVERY_MINUTE, { name: 'job-39' })
  run() {
    this.logger.log('Job39 running');
  }
}
