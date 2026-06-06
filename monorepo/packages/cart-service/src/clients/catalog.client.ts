import { Injectable } from '@nestjs/common';
import {
  createTRPCClient,
  httpBatchLink,
  type CreateTRPCClient,
} from '@trpc/client';
import type { ItemResult } from '@app/shared';
// Type-only import: full type safety from catalog-service's router, zero runtime
// coupling. If catalog-service changes its contract, this stops compiling.
import type { CatalogRouter } from '@app/catalog-service';
import { AppConfiguration } from '../config/app.configuration';

/**
 * Typed tRPC client for the catalog service.
 *
 * Exposes `byId(id)` — the same method the monolith's CatalogService exposes —
 * so CartService is unchanged apart from `await`. The call goes over HTTP.
 */
@Injectable()
export class CatalogClient {
  private readonly client: CreateTRPCClient<CatalogRouter>;

  constructor(config: AppConfiguration) {
    this.client = createTRPCClient<CatalogRouter>({
      links: [httpBatchLink({ url: config.catalogUrl })],
    });
  }

  byId(id: string): Promise<ItemResult> {
    return this.client.item.byId.query({ id });
  }
}
