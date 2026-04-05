import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { setupSchedulerDash } from '@luisrodrigues/nestjs-scheduler-dashboard';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app, { port: 3636 });

  await app.listen(3000);
}

bootstrap();
