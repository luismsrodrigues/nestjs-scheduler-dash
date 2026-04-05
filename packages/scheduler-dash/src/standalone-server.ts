import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
  @Module({
    imports: [
      ServeStaticModule.forRoot({
        rootPath: UI_PATH,
        exclude: ['/api/(.*)'],
      }),
    ],
    controllers: [DashboardController],
    providers: [{ provide: JobsService, useValue: jobsService }],
  })
  class DashboardHttpApp {}

  const app = await NestFactory.create(DashboardHttpApp, { logger: false });

  app.use(createAuthGuard(auth));

  await app.listen(port);
  logger.log(`Dashboard running at http://localhost:${port}`);

  return app;
}
