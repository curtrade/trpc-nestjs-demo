import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { SessionRepository } from './session.repository';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, SessionRepository],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('resolves a seeded session token to its owner (happy path)', () => {
    expect(service.whoami('s1')).toEqual({ userId: 'u1' });
  });

  it('returns null for an unknown token', () => {
    expect(service.whoami('does-not-exist')).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(service.whoami('')).toBeNull();
  });
});
