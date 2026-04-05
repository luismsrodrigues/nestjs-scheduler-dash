import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSchedulerDash, MemoryStorage } from '@nestjs-toolkit/scheduler-dash';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app, {
    storage: new MemoryStorage({ maxExecutions: 5 }),
    basePath: 'scheduler',
    noOverlap: true,
    maxConcurrent: 1,
    // auth: { username: 'admin', password: 'secret' },
  });

  await app.listen(3000);
}

bootstrap();
