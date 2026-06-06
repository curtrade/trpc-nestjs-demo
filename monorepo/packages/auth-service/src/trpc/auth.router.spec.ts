import { AuthService } from '../auth/auth.service';
import { SessionRepository } from '../auth/session.repository';
import { createAuthRouter } from './auth.router';

describe('auth tRPC router', () => {
  const auth = new AuthService(new SessionRepository());
  const router = createAuthRouter(auth);
  const caller = router.createCaller({});

  it('session.whoami resolves a seeded token to its owner', async () => {
    await expect(caller.session.whoami({ token: 's1' })).resolves.toEqual({
      userId: 'u1',
    });
  });

  it('session.whoami returns null for an unknown token', async () => {
    await expect(caller.session.whoami({ token: 'bad' })).resolves.toBeNull();
  });

  it('session.whoami rejects input missing the token (zod validation)', async () => {
    await expect(
      // @ts-expect-error token is required by the input schema
      caller.session.whoami({}),
    ).rejects.toBeDefined();
  });
});
