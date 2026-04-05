import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { readFileSync } from 'fs';
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
    imports: [
      ServeStaticModule.forRoot({
        rootPath: UI_PATH,
        serveStaticOptions: {
          redirect: false,
        },
      }),
    ],
    controllers: [DashboardController],
    providers: [{ provide: JobsService, useValue: jobsService }],
  })
  class DashboardHttpApp {}

  const app = await NestFactory.create(DashboardHttpApp, { logger: false });

  const guard = createAuthGuard(auth);

  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/api')) return next();
    if (req.path.includes('.')) return next();
    guard(req, res, () => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(indexHtml);
    });
  });

  await app.listen(port);
  logger.log(`Dashboard running at http://localhost:${port}`);

  return app;
}
