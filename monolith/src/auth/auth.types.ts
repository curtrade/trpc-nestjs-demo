export interface User {
  id: string;
  name: string;
}

export interface Session {
  token: string;
  userId: string;
}

/**
 * Result of resolving a session token to its owner.
 * `null` means "no such session" — see AuthService.whoami for why this is a
 * nullable return rather than a thrown error.
 */
export type WhoamiResult = { userId: string } | null;
