import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';
import { setupSchedulerDash } from '@nestjs-toolkit/scheduler-dash';
import { AppModule } from './app.module';

@Controller()
class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [HealthController],
  imports: [AppModule],
})
class MainModule {}

async function bootstrap() {
  const app = await NestFactory.create(MainModule);
  
  await setupSchedulerDash(app, { port: 3636, basePath: 'jobs' });
  
  await app.listen(3000);
  console.log('App running on http://localhost:3000');
}

bootstrap();
