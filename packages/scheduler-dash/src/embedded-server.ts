import { INestApplication, Logger } from '@nestjs/common';
import { createAuthGuard } from './auth';
import { JobsService } from './jobs.service';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { dashboardHtml, CONFIG_PLACEHOLDER } from './ui/dashboard';

function configJs(base: string): string {
  return `window.__SCHEDULER_BASE__ = ${JSON.stringify(base)};`;
}

function buildHtml(base: string): string {
  return dashboardHtml.replace(CONFIG_PLACEHOLDER, `<script src="${base}/config.js"></script>`);
}

function registerUiRoutes(expressApp: any, base: string, guard: any): void {
  const html = buildHtml(base);

  expressApp.get(`${base}/config.js`, guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(configJs(base));
  });

  expressApp.get(base, guard, (_req: any, res: any) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  expressApp.get(`${base}/jobs/*path`, guard, (_req: any, res: any) => {
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

  expressApp.post(`${base}/api/executions/:id/stop`, guard, (req: any, res: any) => {
    const id = decodeURIComponent(req.params.id);
    const ok = jobsService.stopExecution(id);
    if (!ok) return res.status(404).json({ message: `Execution "${id}" not found or already finished` });
    res.json({ stopped: id });
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

  logger.log(`Dashboard available at ${base}`);
}
