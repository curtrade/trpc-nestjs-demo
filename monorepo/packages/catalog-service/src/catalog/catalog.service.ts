import { Injectable } from '@nestjs/common';
import type { ItemResult } from '@app/shared';
import { ItemRepository } from './item.repository';

/**
 * Identical business logic to the monolith's CatalogService — same `byId(id)`
 * contract, same nullable "not found" result. The only difference in the
 * monorepo is that this service is reached over tRPC instead of via DI.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly items: ItemRepository) {}

  /**
   * Look up an item by id, returning its price and stock status.
   *
   * Returns `null` for an empty or unknown id — the same nullable "not found"
   * contract as AuthService.whoami, so the `item.byId` tRPC procedure serializes
   * the identical shape. Whether an out-of-stock item can be added is a decision
   * for the Cart service, not here — Catalog just reports the truth.
   */
  byId(id: string): ItemResult {
    if (!id) {
      return null;
    }
    return this.items.findById(id) ?? null;
  }
}
