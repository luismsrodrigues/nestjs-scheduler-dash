import { IncomingMessage, ServerResponse } from 'http';
import { SchedulerDashAuth } from './scheduler-dash.options';

export function checkBasicAuth(req: IncomingMessage, auth: SchedulerDashAuth): boolean {
  const header = req.headers['authorization'] ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  const [username, password] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
  return username === auth.username && password === auth.password;
}

export function rejectUnauthorized(res: ServerResponse): void {
  res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Scheduler Dashboard"' });
  res.end('Unauthorized');
}

export function createAuthGuard(auth: SchedulerDashAuth | undefined) {
  if (!auth) return (_req: any, _res: any, next: any) => next();
  return (req: any, res: any, next: any) => {
    if (!checkBasicAuth(req, auth)) return rejectUnauthorized(res);
    next();
  };
}
