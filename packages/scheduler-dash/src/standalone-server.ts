import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { join } from 'path';
import { readFileSync, existsSync, createReadStream } from 'fs';
import { JobsService } from './jobs.service';
import { DashboardController } from './dashboard.controller';
import { SchedulerDashAuth } from './scheduler-dash.options';
import { createAuthGuard } from './auth';

const UI_PATH = join(__dirname, '../ui');

export async function startStandaloneServer(
  port: number,
  jobsService: JobsService,
  auth: SchedulerDashAuth | undefined,
  logger: Logger,
) {
  const indexHtml = readFileSync(join(UI_PATH, 'index.html'), 'utf-8');

  @Module({
    controllers: [DashboardController],
    providers: [{ provide: JobsService, useValue: jobsService }],
  })
  class DashboardHttpApp {}

  const nestApp = await NestFactory.create(DashboardHttpApp, { logger: false });
  const app = nestApp.getHttpAdapter().getInstance();

  const guard = createAuthGuard(auth);

  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api')) return next();

    const filePath = join(UI_PATH, req.path);
    if (req.path.includes('.') && existsSync(filePath)) {
      const ext = req.path.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        js: 'application/javascript',
        css: 'text/css',
        html: 'text/html',
        json: 'application/json',
        png: 'image/png',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
      };
      res.setHeader('Content-Type', mimeTypes[ext ?? ''] ?? 'application/octet-stream');
      createReadStream(filePath).pipe(res);
      return;
    }

    guard(req, res, () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(indexHtml);
    });
  });

  await nestApp.listen(port);
  logger.log(`Dashboard running at http://localhost:${port}`);

  return nestApp;
}
