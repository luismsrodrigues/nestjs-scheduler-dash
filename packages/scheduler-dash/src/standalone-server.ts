import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Logger } from '@nestjs/common';
import { checkBasicAuth, rejectUnauthorized } from './auth';
import { JobsService } from './jobs.service';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { dashboardHtml } from './ui/dashboard';

const PLACEHOLDER = '__SCHEDULER_BASE_PLACEHOLDER__';

function renderHtml(base: string): string {
  return dashboardHtml.replace(PLACEHOLDER, base);
}

function sendHtml(res: ServerResponse, base: string): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderHtml(base));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function handleGetApi(res: ServerResponse, jobsService: JobsService): void {
  sendJson(res, 200, jobsService.getJobs());
}

function handleTrigger(res: ServerResponse, jobsService: JobsService, encodedName: string): void {
  const name = decodeURIComponent(encodedName);
  const ok = jobsService.triggerJob(name);
  sendJson(res, ok ? 200 : 404, ok ? { triggered: name } : { message: `Job "${name}" not found` });
}

function handleNotFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

function handleStopExecution(res: ServerResponse, jobsService: JobsService, encodedId: string): void {
  const id = decodeURIComponent(encodedId);
  const ok = jobsService.stopExecution(id);
  sendJson(res, ok ? 200 : 404, ok ? { stopped: id } : { message: `Execution "${id}" not found or already finished` });
}

function createRequestHandler(base: string, jobsService: JobsService, auth: SchedulerDashAuth | undefined) {
  const triggerRe = new RegExp(`^${base}/api/([^/]+)/trigger$`);
  const stopExecutionRe = new RegExp(`^${base}/api/executions/([^/]+)/stop$`);

  return (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (auth && !checkBasicAuth(req, auth)) {
      return rejectUnauthorized(res);
    }

    if (method === 'GET' && (url === base || url === `${base}/` || url.startsWith(`${base}/jobs/`))) {
      return sendHtml(res, base);
    }

    if (method === 'GET' && url === `${base}/api`) {
      return handleGetApi(res, jobsService);
    }

    const triggerMatch = url.match(triggerRe);
    if (method === 'POST' && triggerMatch) {
      return handleTrigger(res, jobsService, triggerMatch[1]);
    }

    const stopExecutionMatch = url.match(stopExecutionRe);
    if (method === 'POST' && stopExecutionMatch) {
      return handleStopExecution(res, jobsService, stopExecutionMatch[1]);
    }

    handleNotFound(res);
  };
}

export function startStandaloneServer(
  port: number,
  basePath: string,
  jobsService: JobsService,
  auth: SchedulerDashAuth | undefined,
  logger: Logger,
) {
  const base = `/${basePath}`;
  const handler = createRequestHandler(base, jobsService, auth);
  const server = createServer(handler);

  server.listen(port, () => {
    logger.log(`Dashboard running at http://localhost:${port}${base}`);
  });

  return server;
}
