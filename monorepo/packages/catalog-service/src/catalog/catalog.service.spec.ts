import { Test } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { ItemRepository } from './item.repository';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CatalogService, ItemRepository],
    }).compile();
    service = moduleRef.get(CatalogService);
  });

  it('resolves a seeded item id to its full record', () => {
    expect(service.byId('i1')).toEqual({
      id: 'i1',
      name: 'Coffee Mug',
      price: 1200,
      inStock: true,
    });
  });

  it('reports out-of-stock items truthfully', () => {
    expect(service.byId('i3')).toMatchObject({ inStock: false });
  });

  it('returns null for an unknown id', () => {
    expect(service.byId('nope')).toBeNull();
  });

  it('returns null for an empty id', () => {
    expect(service.byId('')).toBeNull();
  });
});
