import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { SessionRepository } from '../auth/session.repository';
import { CatalogService } from '../catalog/catalog.service';
import { ItemRepository } from '../catalog/item.repository';
import { CartRepository } from './cart.repository';
import { CartService } from './cart.service';

// Real Auth + Catalog (no mocks) so the cross-module chain is actually exercised.
describe('CartService', () => {
  let service: CartService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        CartRepository,
        AuthService,
        SessionRepository,
        CatalogService,
        ItemRepository,
      ],
    }).compile();
    service = moduleRef.get(CartService);
  });

  it('adds an in-stock item using price from Catalog and owner from Auth', () => {
    const cart = service.add('s1', 'i1', 2);
    expect(cart.userId).toBe('u1');
    expect(cart.lines).toEqual([
      { itemId: 'i1', name: 'Coffee Mug', unitPrice: 1200, qty: 2 },
    ]);
    expect(cart.total).toBe(2400);
  });

  it('rejects an unknown session with Unauthorized', () => {
    expect(() => service.add('bad-token', 'i1', 1)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an unknown item with NotFound', () => {
    expect(() => service.add('s1', 'no-such-item', 1)).toThrow(
      NotFoundException,
    );
  });

  it('rejects an out-of-stock item with Conflict', () => {
    expect(() => service.add('s1', 'i3', 1)).toThrow(ConflictException);
  });

  it('accumulates quantity when the same item is added twice', () => {
    service.add('s1', 'i1', 1);
    const cart = service.add('s1', 'i1', 2);
    expect(cart.lines).toEqual([
      { itemId: 'i1', name: 'Coffee Mug', unitPrice: 1200, qty: 3 },
    ]);
  });

  it('persists the cart so a later get returns it (real repository)', () => {
    service.add('s1', 'i1', 2);
    expect(service.get('s1').total).toBe(2400);
  });
});
