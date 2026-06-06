import { Injectable } from '@nestjs/common';
import type { Item } from '@app/shared';
import { SEED_ITEMS } from './catalog.seed';

/** In-memory item store, seeded at construction. Swap for Prisma as an exercise. */
@Injectable()
export class ItemRepository {
  private readonly itemsById = new Map<string, Item>();

  constructor() {
    for (const item of SEED_ITEMS) {
      this.itemsById.set(item.id, item);
    }
  }

  findById(id: string): Item | undefined {
    return this.itemsById.get(id);
  }
}
