import { IncomingMessage, ServerResponse } from 'http';
import { SchedulerDashAuth } from './scheduler-dash.options';

export function checkBasicAuth(req: IncomingMessage, auth: SchedulerDashAuth): boolean {
  const header = (req.headers['authorization'] as string) ?? '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
  const [user, ...rest] = decoded.split(':');
  return user === auth.username && rest.join(':') === auth.password;
}

export function rejectUnauthorized(res: ServerResponse): void {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="Scheduler Dashboard"',
    'Content-Type': 'text/plain',
  });
  res.end('Unauthorized');
}

/** Express middleware that enforces Basic Auth when `auth` is configured. */
export function createAuthGuard(auth: SchedulerDashAuth | undefined) {
  return (req: any, res: any, next: any) => {
    if (!auth) return next();
    if (!checkBasicAuth(req, auth)) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Scheduler Dashboard"');
      return res.status(401).send('Unauthorized');
    }
    next();
  };
}
