import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsService {
  private readonly registeredJobs = ['data-processor'];

  getStats() {
    return {
      totalJobs: this.registeredJobs.length,
      jobNames: this.registeredJobs,
    };
  }
}
