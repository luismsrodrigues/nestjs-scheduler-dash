import { HttpServer } from 'tsrpc';
import { serviceAProto } from '@sample-ms/shared';

const PORT = Number(process.env.RANDOM_SERVICE_PORT ?? 4001);

async function bootstrap() {
  const server = new HttpServer(serviceAProto, {
    port: PORT,
    json: true,
    logger: console,
  });

  server.implementApi('Greet', async call => {
    const { name } = call.req;
    call.succ({ message: `Hello, ${name}! — greetings from Random Service` });
  });

  await server.start();
  console.log(`[random-service] TSRPC server listening on http://localhost:${PORT}`);
}

bootstrap().catch(err => {
  console.error('[random-service] fatal:', err);
  process.exit(1);
});
