import { Injectable } from '@nestjs/common';
import { ItemRepository } from './item.repository';
import { ItemResult } from './catalog.types';

@Injectable()
export class CatalogService {
  constructor(private readonly items: ItemRepository) {}

  /**
   * Look up an item by id, returning its price and stock status.
   *
   * Returns `null` for an empty or unknown id — the same nullable "not found"
   * contract as AuthService.whoami, so the monorepo's `item.byId` tRPC procedure
   * serializes the identical shape. Whether an out-of-stock item can be added is
   * a decision for the Cart module, not here — Catalog just reports the truth.
   */
  byId(id: string): ItemResult {
    if (!id) {
      return null;
    }
    return this.items.findById(id) ?? null;
  }
}
