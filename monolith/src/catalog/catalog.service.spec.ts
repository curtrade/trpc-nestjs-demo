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

  it('returns a seeded item with price and stock (happy path)', () => {
    expect(service.byId('i1')).toEqual({
      id: 'i1',
      name: 'Coffee Mug',
      price: 1200,
      inStock: true,
    });
  });

  it('returns null for an unknown id', () => {
    expect(service.byId('does-not-exist')).toBeNull();
  });

  it('returns an out-of-stock item with inStock false (not null)', () => {
    expect(service.byId('i3')).toMatchObject({ id: 'i3', inStock: false });
  });

  it('returns null for an empty id', () => {
    expect(service.byId('')).toBeNull();
  });
});
