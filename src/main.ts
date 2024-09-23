import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@app/lib';
import { ResponseInterceptor } from '@app/lib';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const PORT = process.env.PORT;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter()); // * exception formatter
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector())); // * success response formatter
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const options = new DocumentBuilder()
    .setTitle('Tiny Restaurant API Documentation')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('Public')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT);
  Logger.log(`🚀 Application is running on: http://localhost:${PORT}`);
}

bootstrap();
