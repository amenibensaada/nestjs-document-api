import { NestFactory } from '@nestjs/core';
import { AppModule, configure } from './app';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  const app = configure(await NestFactory.create(AppModule, { bodyParser: true }));
  await app.listen(port, '0.0.0.0');
}
bootstrap().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
