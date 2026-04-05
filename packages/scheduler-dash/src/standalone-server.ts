import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Logger } from '@nestjs/common';
import { checkBasicAuth, rejectUnauthorized } from './auth';
import { JobsService } from './jobs.service';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { dashboardHtml } from './ui/dashboard';

function sendHtml(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(dashboardHtml);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function createRequestHandler(jobsService: JobsService, auth: SchedulerDashAuth | undefined) {
  const triggerRe       = /^\/api\/([^/]+)\/trigger$/;
  const stopExecutionRe = /^\/api\/executions\/([^/]+)\/stop$/;

  return (req: IncomingMessage, res: ServerResponse) => {
    const url    = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (auth && !checkBasicAuth(req, auth)) return rejectUnauthorized(res);

    // SPA shell — serve index for all UI routes
    if (method === 'GET' && (url === '/' || url === '/jobs' || url.startsWith('/jobs/'))) {
      return sendHtml(res);
    }

    if (method === 'GET' && url === '/api') {
      try {
        return sendJson(res, 200, jobsService.getJobs());
      } catch (err) {
        return sendJson(res, 500, { error: String(err) });
      }
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
  jobsService: JobsService,
  auth: SchedulerDashAuth | undefined,
  logger: Logger,
) {
  const handler = createRequestHandler(jobsService, auth);
  const server  = createServer(handler);

  server.listen(port, () => {
    logger.log(`Dashboard running at http://localhost:${port}`);
  });

  return server;
}
