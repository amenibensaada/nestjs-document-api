import 'reflect-metadata';
import { Controller, Get, INestApplication, Module, ValidationPipe } from '@nestjs/common';
import { DocumentsController, DocumentsService } from './documents';

@Controller('health')
class HealthController {
  @Get() check() { return { status: 'ok', storage: 'memory' }; }
}

@Module({ controllers: [HealthController, DocumentsController], providers: [DocumentsService] })
export class AppModule {}

export function configure(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  return app;
}
