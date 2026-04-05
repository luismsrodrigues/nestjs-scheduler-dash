import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Server } from 'http';
import { SCHEDULER_DASH_OPTIONS, SCHEDULER_DASH_STORAGE } from './scheduler-dash.options';
import { SchedulerDashContext } from './scheduler-dash.context';
import { SchedulerDashOptions } from './scheduler-dash.options';
import { Storage } from './storage/storage.abstract';
import { JobsService } from './jobs.service';
import { startDashboardServer } from './dashboard.server';

@Injectable()
export class JobsTrackerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private standaloneServer: Server | null = null;

  constructor(
    @Inject(SCHEDULER_DASH_STORAGE) private readonly storage: Storage,
    @Inject(SCHEDULER_DASH_OPTIONS) private readonly options: SchedulerDashOptions,
    private readonly jobsService: JobsService,
  ) {}

  onApplicationBootstrap() {
    SchedulerDashContext.storage = this.storage;

    if (this.options.port) {
      this.standaloneServer = startDashboardServer(
        this.options.port,
        this.jobsService,
        this.options.auth,
      );
    }
  }

  onApplicationShutdown() {
    this.standaloneServer?.close();
  }
}
