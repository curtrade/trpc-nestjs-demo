import { CatalogService } from '../catalog/catalog.service';
import { ItemRepository } from '../catalog/item.repository';
import { createCatalogRouter } from './catalog.router';

describe('catalog tRPC router', () => {
  const catalog = new CatalogService(new ItemRepository());
  const router = createCatalogRouter(catalog);
  const caller = router.createCaller({});

  it('item.byId resolves a seeded id to its full record', async () => {
    await expect(caller.item.byId({ id: 'i1' })).resolves.toEqual({
      id: 'i1',
      name: 'Coffee Mug',
      price: 1200,
      inStock: true,
    });
  });

  it('item.byId returns null for an unknown id', async () => {
    await expect(caller.item.byId({ id: 'nope' })).resolves.toBeNull();
  });

  it('item.byId rejects input missing the id (zod validation)', async () => {
    await expect(
      // @ts-expect-error id is required by the input schema
      caller.item.byId({}),
    ).rejects.toBeDefined();
  });
});
