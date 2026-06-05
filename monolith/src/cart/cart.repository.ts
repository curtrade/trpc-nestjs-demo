import { Injectable } from '@nestjs/common';
import { CartLine } from './cart.types';

/** In-memory cart store, keyed by user id. Swap for Prisma as an exercise. */
@Injectable()
export class CartRepository {
  private readonly linesByUser = new Map<string, CartLine[]>();

  getLines(userId: string): CartLine[] {
    return this.linesByUser.get(userId) ?? [];
  }

  /**
   * Add a line to a user's cart. If the same item is already present, its
   * quantity is increased rather than duplicating the line.
   */
  addLine(userId: string, line: CartLine): CartLine[] {
    const lines = this.linesByUser.get(userId) ?? [];
    const existing = lines.find((l) => l.itemId === line.itemId);
    if (existing) {
      existing.qty += line.qty;
    } else {
      lines.push({ ...line });
    }
    this.linesByUser.set(userId, lines);
    return lines;
  }
}
