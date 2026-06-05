import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Cart (e2e) — covers AE1', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('AE1: POST /cart/items adds an item with price from Catalog and owner from Auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 's1')
      .send({ itemId: 'i1', qty: 2 })
      .expect(201);

    expect(res.body).toEqual({
      userId: 'u1',
      lines: [{ itemId: 'i1', name: 'Coffee Mug', unitPrice: 1200, qty: 2 }],
      total: 2400,
    });
  });

  it('GET /cart returns the persisted cart for the session', async () => {
    await request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 's2')
      .send({ itemId: 'i2', qty: 1 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/cart')
      .set('x-session-token', 's2')
      .expect(200);

    expect(res.body.userId).toBe('u2');
    expect(res.body.total).toBe(2500);
  });

  it('rejects an unknown session with 401', () => {
    return request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 'bad-token')
      .send({ itemId: 'i1', qty: 1 })
      .expect(401);
  });

  it('rejects an unknown item with 404', () => {
    return request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 's1')
      .send({ itemId: 'no-such-item', qty: 1 })
      .expect(404);
  });

  it('rejects an out-of-stock item with 409', () => {
    return request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 's1')
      .send({ itemId: 'i3', qty: 1 })
      .expect(409);
  });

  it('rejects an invalid body (qty < 1) with 400', () => {
    return request(app.getHttpServer())
      .post('/cart/items')
      .set('x-session-token', 's1')
      .send({ itemId: 'i1', qty: 0 })
      .expect(400);
  });
});
