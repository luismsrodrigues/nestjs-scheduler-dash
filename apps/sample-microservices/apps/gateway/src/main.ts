import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = Number(process.env.GATEWAY_PORT ?? 3000);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  console.log(`[gateway] HTTP server → http://localhost:${PORT}`);
  console.log(`[gateway]   GET /greet?name=<name>   → random-service (TSRPC :4001)`);
  console.log(`[gateway]   GET /scheduler/stats      → scheduler-service (TSRPC :4002)`);
}

bootstrap().catch(err => {
  console.error('[gateway] fatal:', err);
  process.exit(1);
});
