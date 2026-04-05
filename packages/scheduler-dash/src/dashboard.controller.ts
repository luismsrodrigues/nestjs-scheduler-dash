import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('api')
export class DashboardController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getJobs() {
    return this.jobsService.getJobs();
  }

  @Get(':name')
  getJob(@Param('name') name: string) {
    const job = this.jobsService.getJob(name);
    if (!job) throw new HttpException(`Job "${name}" not found`, HttpStatus.NOT_FOUND);
    return job;
  }

  @Post(':name/trigger')
  triggerJob(@Param('name') name: string) {
    const ok = this.jobsService.triggerJob(name);
    if (!ok) throw new HttpException(`Job "${name}" not found`, HttpStatus.NOT_FOUND);
    return { triggered: name };
  }

  @Post('executions/:id/stop')
  stopExecution(@Param('id') id: string) {
    const ok = this.jobsService.stopExecution(id);
    if (!ok) throw new HttpException(`Execution "${id}" not found or already finished`, HttpStatus.NOT_FOUND);
    return { stopped: id };
  }
}
