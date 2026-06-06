import { Injectable } from '@nestjs/common';
import type { WhoamiResult } from '@app/shared';
import { SessionRepository } from './session.repository';

/**
 * Identical business logic to the monolith's AuthService — same `whoami(token)`
 * contract, same nullable "not found" result. The only difference in the
 * monorepo is that this service is reached over tRPC instead of via DI.
 */
@Injectable()
export class AuthService {
  constructor(private readonly sessions: SessionRepository) {}

  whoami(token: string): WhoamiResult {
    if (!token) {
      return null;
    }
    const session = this.sessions.findSessionByToken(token);
    return session ? { userId: session.userId } : null;
  }
}
