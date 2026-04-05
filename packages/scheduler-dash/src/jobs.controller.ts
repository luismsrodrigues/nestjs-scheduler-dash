import { Controller, Get, Header, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { BasicAuthGuard } from './basic-auth.guard';
import { JobsService } from './jobs.service';
import { dashboardHtml } from './ui/dashboard';

@Controller('_jobs')
@UseGuards(BasicAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ── Dashboard UI ─────────────────────────────────────────────────────────────

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  dashboard() {
    return dashboardHtml;
  }

  /** SPA fallback for React Router client-side routes (e.g. /_jobs/jobs/:name) */
  @Get('jobs/:name')
  @Header('Content-Type', 'text/html; charset=utf-8')
  dashboardDetail() {
    return dashboardHtml;
  }

  // ── REST API ──────────────────────────────────────────────────────────────────

  @Get('api')
  getJobs() {
    return this.jobsService.getJobs();
  }

  @Post('api/:name/trigger')
  triggerJob(@Param('name') name: string) {
    const ok = this.jobsService.triggerJob(name);
    if (!ok) throw new NotFoundException(`Job "${name}" not found`);
    return { triggered: name };
  }

  @Post('api/:name/stop')
  stopJob(@Param('name') name: string) {
    const ok = this.jobsService.stopJob(name);
    if (!ok) throw new NotFoundException(`Job "${name}" not found`);
    return { stopped: name };
  }

  @Post('api/:name/start')
  startJob(@Param('name') name: string) {
    const ok = this.jobsService.startJob(name);
    if (!ok) throw new NotFoundException(`Job "${name}" not found`);
    return { started: name };
  }
}
