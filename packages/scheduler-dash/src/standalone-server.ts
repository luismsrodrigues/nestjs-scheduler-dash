import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Logger } from '@nestjs/common';
import { checkBasicAuth, rejectUnauthorized } from './auth';
import { JobsService } from './jobs.service';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { dashboardHtml, CONFIG_PLACEHOLDER } from './ui/dashboard';

function buildHtml(base: string): string {
  return dashboardHtml.replace(CONFIG_PLACEHOLDER, `<script src="${base}/config.js"></script>`);
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function sendConfigJs(res: ServerResponse, base: string): void {
  res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
  res.end(`window.__SCHEDULER_BASE__ = ${JSON.stringify(base)};`);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function createRequestHandler(base: string, jobsService: JobsService, auth: SchedulerDashAuth | undefined) {
  const html            = buildHtml(base);
  const triggerRe       = new RegExp(`^${base}/api/([^/]+)/trigger$`);
  const stopExecutionRe = new RegExp(`^${base}/api/executions/([^/]+)/stop$`);

  return (req: IncomingMessage, res: ServerResponse) => {
    const url    = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (auth && !checkBasicAuth(req, auth)) return rejectUnauthorized(res);

    if (method === 'GET' && url === `${base}/config.js`) {
      return sendConfigJs(res, base);
    }

    if (method === 'GET' && (url === base || url === `${base}/` || url.startsWith(`${base}/jobs/`))) {
      return sendHtml(res, html);
    }

    if (method === 'GET' && url === `${base}/api`) {
      return sendJson(res, 200, jobsService.getJobs());
    }

    const triggerMatch = url.match(triggerRe);
    if (method === 'POST' && triggerMatch) {
      const name = decodeURIComponent(triggerMatch[1]);
      const ok   = jobsService.triggerJob(name);
      return sendJson(res, ok ? 200 : 404, ok ? { triggered: name } : { message: `Job "${name}" not found` });
    }

    const stopMatch = url.match(stopExecutionRe);
    if (method === 'POST' && stopMatch) {
      const id = decodeURIComponent(stopMatch[1]);
      const ok = jobsService.stopExecution(id);
      return sendJson(res, ok ? 200 : 404, ok ? { stopped: id } : { message: `Execution "${id}" not found or already finished` });
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  };
}

export function startStandaloneServer(
  port: number,
  basePath: string,
  jobsService: JobsService,
  auth: SchedulerDashAuth | undefined,
  logger: Logger,
) {
  const base    = `/${basePath}`;
  const handler = createRequestHandler(base, jobsService, auth);
  const server  = createServer(handler);

  server.listen(port, () => {
    logger.log(`Dashboard running at http://localhost:${port}${base}`);
  });

  return server;
}
