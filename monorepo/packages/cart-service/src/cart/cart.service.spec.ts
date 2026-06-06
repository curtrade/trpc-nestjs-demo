import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ItemResult, WhoamiResult } from '@app/shared';
import { AuthClient } from '../clients/auth.client';
import { CatalogClient } from '../clients/catalog.client';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

/**
 * The two tRPC clients are faked so the test stays fast and offline — it
 * exercises CartService's orchestration and error mapping, not the network.
 * The fakes return the exact shapes auth-service and catalog-service return
 * over the wire (validated by the shared zod schemas), so this is faithful.
 * The real transport is proven by the live full-stack check in the README demo.
 */
class FakeAuthClient {
  whoami(token: string): Promise<WhoamiResult> {
    return Promise.resolve(token === 's1' ? { userId: 'u1' } : null);
  }
}

class FakeCatalogClient {
  byId(id: string): Promise<ItemResult> {
    const catalog: Record<string, ItemResult> = {
      i1: { id: 'i1', name: 'Coffee Mug', price: 1200, inStock: true },
      i3: { id: 'i3', name: 'Sticker Pack', price: 500, inStock: false },
    };
    return Promise.resolve(catalog[id] ?? null);
  }
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CartService, CartRepository],
    })
      .useMocker((token) => {
        if (token === AuthClient) return new FakeAuthClient();
        if (token === CatalogClient) return new FakeCatalogClient();
        return undefined;
      })
      .compile();
    service = moduleRef.get(CartService);
  });

  it('adds an in-stock item using price from Catalog and owner from Auth', async () => {
    const cart = await service.add('s1', 'i1', 2);
    expect(cart.userId).toBe('u1');
    expect(cart.lines).toEqual([
      { itemId: 'i1', name: 'Coffee Mug', unitPrice: 1200, qty: 2 },
    ]);
    expect(cart.total).toBe(2400);
  });

  it('rejects an unknown session with Unauthorized', async () => {
    await expect(service.add('bad-token', 'i1', 1)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown item with NotFound', async () => {
    await expect(service.add('s1', 'no-such-item', 1)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects an out-of-stock item with Conflict', async () => {
    await expect(service.add('s1', 'i3', 1)).rejects.toThrow(ConflictException);
  });

  it('accumulates quantity when the same item is added twice', async () => {
    await service.add('s1', 'i1', 1);
    const cart = await service.add('s1', 'i1', 2);
    expect(cart.lines).toEqual([
      { itemId: 'i1', name: 'Coffee Mug', unitPrice: 1200, qty: 3 },
    ]);
  });

  it('persists the cart so a later get returns it (real repository)', async () => {
    await service.add('s1', 'i1', 2);
    expect((await service.get('s1')).total).toBe(2400);
  });
});
