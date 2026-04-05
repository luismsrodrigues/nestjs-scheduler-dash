import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { setupSchedulerDash } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Dashboard runs on its own port (default: 3636).
  // Must be called BEFORE app.listen() so storage is ready before cron jobs start.
  await setupSchedulerDash(app, { port: 3636 });

  await app.listen(3000);
  console.log('App running at   http://localhost:3000');
  console.log('Dashboard at     http://localhost:3636');
}

bootstrap();
