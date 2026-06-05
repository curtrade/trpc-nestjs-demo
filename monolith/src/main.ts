import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfiguration } from './config/app.configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Config is already validated at this point; bad config would have thrown
  // inside NestFactory.create above.
  const config = app.get(AppConfiguration);
  await app.listen(config.port);
}

void bootstrap();
