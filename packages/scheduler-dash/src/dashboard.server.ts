import { createServer, IncomingMessage, ServerResponse } from 'http';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { JobsService } from './jobs.service';
import { dashboardHtml } from './ui/dashboard';

function unauthorized(res: ServerResponse) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Scheduler Dashboard"',
    'Content-Type': 'text/plain',
  });
  res.end('Unauthorized');
}

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function checkAuth(req: IncomingMessage, auth: SchedulerDashAuth): boolean {
  const header = req.headers['authorization'] ?? '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const [user, ...rest] = decoded.split(':');
  return user === auth.username && rest.join(':') === auth.password;
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

export function startDashboardServer(
  port: number,
  jobsService: JobsService,
  auth?: SchedulerDashAuth,
) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // Auth check
    if (auth && !checkAuth(req, auth)) {
      return unauthorized(res);
    }

    // GET /  or  GET /jobs/:name  → serve dashboard HTML
    if (method === 'GET' && (url === '/' || url.startsWith('/jobs/'))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(dashboardHtml);
    }

    // GET /api → jobs list
    if (method === 'GET' && url === '/api') {
      return json(res, 200, jobsService.getJobs());
    }

    // POST /api/:name/trigger|stop|start
    const actionMatch = url.match(/^\/api\/([^/]+)\/(trigger|stop|start)$/);
    if (method === 'POST' && actionMatch) {
      await readBody(req);
      const name = decodeURIComponent(actionMatch[1]);
      const action = actionMatch[2] as 'trigger' | 'stop' | 'start';

      const ok =
        action === 'trigger' ? jobsService.triggerJob(name) :
        action === 'stop'    ? jobsService.stopJob(name) :
                               jobsService.startJob(name);

      if (!ok) return json(res, 404, { message: `Job "${name}" not found` });
      return json(res, 200, { [action === 'trigger' ? 'triggered' : action === 'stop' ? 'stopped' : 'started']: name });
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.listen(port, () => {
    console.log(`[SchedulerDash] Dashboard running at http://localhost:${port}`);
  });

  return server;
}
