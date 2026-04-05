import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
<<<<<<< Updated upstream

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
=======
import { setupSchedulerDash, MemoryStorage } from '@luisrodrigues/nestjs-scheduler-dashboard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setupSchedulerDash(app, {
    storage: new MemoryStorage({ historyRetention: 2 }),
    basePath: 'scheduler',
    // noOverlap: true,
    // maxConcurrent: 1,
    // auth: { username: 'admin', password: 'secret' },
  });

>>>>>>> Stashed changes
  await app.listen(3000);
}

bootstrap();
