import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AddItemDto } from './cart.dto';
import { CartService } from './cart.service';
import { Cart } from './cart.types';

/**
 * Public REST entry point for the Cart domain.
 *
 * The session token is read from the `x-session-token` header so the README demo
 * is a plain curl. In the monorepo, this same controller fronts a service that
 * fans out to Auth and Catalog over tRPC — the public edge stays REST.
 */
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Post('items')
  addItem(
    @Headers('x-session-token') token: string,
    @Body() dto: AddItemDto,
  ): Cart {
    return this.cart.add(token, dto.itemId, dto.qty);
  }

  @Get()
  getCart(@Headers('x-session-token') token: string): Cart {
    return this.cart.get(token);
  }
}
