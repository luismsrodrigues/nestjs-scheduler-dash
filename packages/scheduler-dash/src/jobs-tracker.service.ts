import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SCHEDULER_DASH_STORAGE } from './scheduler-dash.options';
import { SchedulerDashContext } from './scheduler-dash.context';
import { Storage } from './storage/storage.abstract';

@Injectable()
export class JobsTrackerService implements OnApplicationBootstrap {
  constructor(
    @Inject(SCHEDULER_DASH_STORAGE) private readonly storage: Storage,
  ) {}

  onApplicationBootstrap() {
    SchedulerDashContext.storage = this.storage;
  }
}
