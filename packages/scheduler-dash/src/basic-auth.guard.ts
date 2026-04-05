import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SCHEDULER_DASH_OPTIONS, SchedulerDashOptions } from './scheduler-dash.options';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    @Inject(SCHEDULER_DASH_OPTIONS) private readonly options: SchedulerDashOptions,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.options.auth) return true; // no auth configured → allow

    const req = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const res = context.switchToHttp().getResponse<{ setHeader(k: string, v: string): void }>();

    const header = req.headers['authorization'] ?? '';
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
      const [user, ...rest] = decoded.split(':');
      if (user === this.options.auth.username && rest.join(':') === this.options.auth.password) {
        return true;
      }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Scheduler Dashboard"');
    throw new UnauthorizedException('Invalid credentials');
  }
}
