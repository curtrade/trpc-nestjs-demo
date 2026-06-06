import { Injectable } from '@nestjs/common';
import { SEED_SESSIONS, SEED_USERS } from './auth.seed';
import { Session, User } from './auth.types';

/** In-memory session/user store, seeded at construction. Owned by this service. */
@Injectable()
export class SessionRepository {
  private readonly usersById = new Map<string, User>();
  private readonly sessionsByToken = new Map<string, Session>();

  constructor() {
    for (const user of SEED_USERS) {
      this.usersById.set(user.id, user);
    }
    for (const session of SEED_SESSIONS) {
      this.sessionsByToken.set(session.token, session);
    }
  }

  findSessionByToken(token: string): Session | undefined {
    return this.sessionsByToken.get(token);
  }

  findUserById(id: string): User | undefined {
    return this.usersById.get(id);
  }
}
