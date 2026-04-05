import { Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('_jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getJobs() {
    return this.jobsService.getJobs();
  }

  @Post(':name/trigger')
  triggerJob(@Param('name') name: string) {
    const result = this.jobsService.triggerJob(name);
    if (!result) throw new NotFoundException(`Job "${name}" not found`);
    return { triggered: name };
  }

  @Post(':name/stop')
  stopJob(@Param('name') name: string) {
    const result = this.jobsService.stopJob(name);
    if (!result) throw new NotFoundException(`Job "${name}" not found`);
    return { stopped: name };
  }

  @Post(':name/start')
  startJob(@Param('name') name: string) {
    const result = this.jobsService.startJob(name);
    if (!result) throw new NotFoundException(`Job "${name}" not found`);
    return { started: name };
  }
}
