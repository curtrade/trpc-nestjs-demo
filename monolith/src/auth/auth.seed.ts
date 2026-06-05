import { Session, User } from './auth.types';

/** Deterministic seed data so README examples are reproducible. */
export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

export const SEED_SESSIONS: Session[] = [
  { token: 's1', userId: 'u1' },
  { token: 's2', userId: 'u2' },
];
