import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CatalogService } from '../catalog/catalog.service';
import { CartRepository } from './cart.repository';
import { Cart, CartLine } from './cart.types';

@Injectable()
export class CartService {
  constructor(
    private readonly auth: AuthService,
    private readonly catalog: CatalogService,
    private readonly carts: CartRepository,
  ) {}

  /**
   * Add an item to the caller's cart.
   *
   * This is the heart of the teaching example. In the monolith these are plain
   * in-process calls to injected services:
   *   - this.auth.whoami(token)   — who owns this cart?
   *   - this.catalog.byId(itemId) — current price and stock?
   *
   * In the monorepo project, CartService keeps the exact same shape but those
   * two calls become tRPC client calls over HTTP. Only the transport changes.
   */
  add(sessionToken: string, itemId: string, qty: number): Cart {
    const who = this.auth.whoami(sessionToken);
    if (!who) {
      throw new UnauthorizedException('Unknown session');
    }

    const item = this.catalog.byId(itemId);
    if (!item) {
      throw new NotFoundException(`Unknown item: ${itemId}`);
    }
    if (!item.inStock) {
      throw new ConflictException(`Item out of stock: ${itemId}`);
    }

    const lines = this.carts.addLine(who.userId, {
      itemId: item.id,
      name: item.name,
      unitPrice: item.price,
      qty,
    });
    return this.toCart(who.userId, lines);
  }

  get(sessionToken: string): Cart {
    const who = this.auth.whoami(sessionToken);
    if (!who) {
      throw new UnauthorizedException('Unknown session');
    }
    return this.toCart(who.userId, this.carts.getLines(who.userId));
  }

  private toCart(userId: string, lines: CartLine[]): Cart {
    const total = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    return { userId, lines, total };
  }
}
