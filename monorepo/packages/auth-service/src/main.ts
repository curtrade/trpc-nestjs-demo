import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { AppConfiguration } from './config/app.configuration';
import { AuthService } from './auth/auth.service';
import { createAuthRouter } from './trpc/auth.router';
import { createContext } from './trpc/trpc.context';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Pull the domain service out of Nest's DI container and hand it to the tRPC
  // router factory, then mount the router on the underlying Express instance.
  const authService = app.get(AuthService);
  const appRouter = createAuthRouter(authService);
  app
    .getHttpAdapter()
    .getInstance()
    .use(
      '/trpc',
      createExpressMiddleware({ router: appRouter, createContext }),
    );

  const config = app.get(AppConfiguration);
  await app.listen(config.port);
}

void bootstrap();
