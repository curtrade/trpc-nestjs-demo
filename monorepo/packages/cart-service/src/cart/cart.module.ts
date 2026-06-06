import { Module } from '@nestjs/common';
import { AuthClient } from '../clients/auth.client';
import { CatalogClient } from '../clients/catalog.client';
import { CartController } from './cart.controller';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

/**
 * In the monolith, CartModule imported AuthModule and CatalogModule to reach
 * their services through DI. Here those cross-module imports are gone: Cart
 * reaches Auth and Catalog through tRPC CLIENTS (AuthClient, CatalogClient),
 * which are ordinary injectable providers wrapping a network call.
 */
@Module({
  providers: [CartService, CartRepository, AuthClient, CatalogClient],
  controllers: [CartController],
})
export class CartModule {}
