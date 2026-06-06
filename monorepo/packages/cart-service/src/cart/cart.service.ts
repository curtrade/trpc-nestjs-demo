import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthClient } from '../clients/auth.client';
import { CatalogClient } from '../clients/catalog.client';
import { CartRepository } from './cart.repository';
import { Cart, CartLine } from './cart.types';

@Injectable()
export class CartService {
  constructor(
    private readonly auth: AuthClient,
    private readonly catalog: CatalogClient,
    private readonly carts: CartRepository,
  ) {}

  /**
   * Add an item to the caller's cart.
   *
   * Compare this body to the monolith's CartService.add — it is line-for-line
   * the same logic. In the monolith, `auth` and `catalog` were injected domain
   * services and the calls were synchronous and in-process. Here they are tRPC
   * CLIENTS and the calls cross the network, so the method is `async` and the
   * two lookups are `await`ed. That is the entire difference: the transport.
   */
  async add(sessionToken: string, itemId: string, qty: number): Promise<Cart> {
    const who = await this.auth.whoami(sessionToken);
    if (!who) {
      throw new UnauthorizedException('Unknown session');
    }

    const item = await this.catalog.byId(itemId);
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

  async get(sessionToken: string): Promise<Cart> {
    const who = await this.auth.whoami(sessionToken);
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
