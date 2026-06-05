import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { HealthController } from './health.controller';

/**
 * Root module of the monolith.
 *
 * Feature modules (Auth, Catalog, Cart) are added here as they are built. In the
 * monolith they talk to each other purely through NestJS dependency injection —
 * no network hops. The monorepo project splits these same modules into separate
 * services that talk over tRPC instead.
 */
@Module({
  imports: [ConfigifyModule.forRootAsync()],
  controllers: [HealthController],
})
export class AppModule {}
