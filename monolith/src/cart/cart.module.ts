import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

/**
 * Cart depends on Auth and Catalog. It reaches them by importing their modules
 * (which export their services) — the canonical NestJS way to cross feature
 * boundaries. In the monorepo, these imports are replaced by tRPC clients.
 */
@Module({
  imports: [AuthModule, CatalogModule],
  providers: [CartService, CartRepository],
  controllers: [CartController],
})
export class CartModule {}
