import {
  itemByIdInput,
  itemByIdOutput,
  publicProcedure,
  router,
} from '@app/shared';
import type { CatalogService } from '../catalog/catalog.service';

/**
 * Build the catalog tRPC router around a CatalogService instance.
 *
 * The router is deliberately thin: it only adapts tRPC input/output to a call on
 * the injected service. All business logic stays in CatalogService — exactly the
 * service the monolith calls directly. main.ts pulls CatalogService out of the
 * Nest DI container and passes it here.
 */
export function createCatalogRouter(catalog: CatalogService) {
  return router({
    item: router({
      byId: publicProcedure
        .input(itemByIdInput)
        .output(itemByIdOutput)
        .query(({ input }) => catalog.byId(input.id)),
    }),
  });
}

/**
 * The exported router *type*. Other services import this with `import type` and
 * build a typed client — no runtime dependency on catalog-service crosses the wire.
 */
export type CatalogRouter = ReturnType<typeof createCatalogRouter>;
