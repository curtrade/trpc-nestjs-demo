import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { WhoamiResult } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly sessions: SessionRepository) {}

  /**
   * Resolve a session token to its owning user id.
   *
   * Returns `null` when the token is empty or unknown — callers decide how to
   * surface that (the Cart module turns it into an HTTP 401). Keeping "not
   * found" as a nullable return rather than a thrown error means the monorepo's
   * tRPC `session.whoami` procedure can serialize this exact same shape with
   * zero error-mapping. The call site in Cart stays identical across both
   * projects; only the transport changes.
   */
  whoami(token: string): WhoamiResult {
    if (!token) {
      return null;
    }
    const session = this.sessions.findSessionByToken(token);
    if (!session) {
      return null;
    }
    return { userId: session.userId };
  }
}
