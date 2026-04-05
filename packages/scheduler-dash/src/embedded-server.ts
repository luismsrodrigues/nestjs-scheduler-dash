import { INestApplication, Logger } from '@nestjs/common';
import { createAuthGuard } from './auth';
import { JobsService } from './jobs.service';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { dashboardHtml } from './ui/dashboard';

const PLACEHOLDER = '__SCHEDULER_BASE_PLACEHOLDER__';

function renderHtml(base: string): string {
  return dashboardHtml.replace(PLACEHOLDER, base);
}

function registerUiRoutes(expressApp: any, base: string, guard: any): void {
  const html = renderHtml(base);
  expressApp.get(base, guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
  expressApp.get(`${base}/jobs/*`, guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
}

function registerApiRoutes(expressApp: any, base: string, guard: any, jobsService: JobsService): void {
  expressApp.get(`${base}/api`, guard, (_req: any, res: any) => {
    res.json(jobsService.getJobs());
  });

  expressApp.post(`${base}/api/:name/trigger`, guard, (req: any, res: any) => {
    const name = decodeURIComponent(req.params.name);
    const ok = jobsService.triggerJob(name);
    if (!ok) return res.status(404).json({ message: `Job "${name}" not found` });
    res.json({ triggered: name });
  });
}

export function mountOnApp(
  app: INestApplication,
  basePath: string,
  jobsService: JobsService,
  auth: SchedulerDashAuth | undefined,
  logger: Logger,
): void {
  const base = `/${basePath}`;
  const expressApp = app.getHttpAdapter().getInstance();
  const guard = createAuthGuard(auth);

  registerUiRoutes(expressApp, base, guard);
  registerApiRoutes(expressApp, base, guard, jobsService);

  logger.log(`Dashboard available at http://localhost:<port>${base}`);
  logger.log(`API available at http://localhost:<port>${base}/api`);
}
