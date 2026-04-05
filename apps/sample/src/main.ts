import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSchedulerDash, MemoryStorage } from '@nestjs-toolkit/scheduler-dash';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app, {
    storage: new MemoryStorage({ historyRetention: 2 }),
    basePath: 'scheduler',
  });

  await app.listen(3000);
}

bootstrap();
