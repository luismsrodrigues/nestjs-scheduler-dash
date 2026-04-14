import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { HttpServer } from 'tsrpc';
import { serviceBProto } from '@sample-ms/shared';
import { ServiceBModule } from './app.module';
import { StatsService } from './stats.service';

const NESTJS_PORT = Number(process.env.SCHEDULER_SERVICE_HTTP_PORT ?? 4003);
const TSRPC_PORT = Number(process.env.SCHEDULER_SERVICE_PORT ?? 4002);

async function bootstrap() {
  const app = await NestFactory.create(ServiceBModule);
  await app.listen(NESTJS_PORT);
  console.log(`[scheduler-service] NestJS HTTP → http://localhost:${NESTJS_PORT}`);
  console.log(`[scheduler-service] Dashboard   → http://localhost:${NESTJS_PORT}/_scheduler  (admin/admin)`);

  const statsService = app.get(StatsService);

  const tsrpcServer = new HttpServer(serviceBProto, {
    port: TSRPC_PORT,
    json: true,
    logger: console,
  });

  tsrpcServer.implementApi('GetSchedulerStats', async call => {
    call.succ(statsService.getStats());
  });

  await tsrpcServer.start();
  console.log(`[scheduler-service] TSRPC server → http://localhost:${TSRPC_PORT}`);
}

bootstrap().catch(err => {
  console.error('[scheduler-service] fatal:', err);
  process.exit(1);
});
