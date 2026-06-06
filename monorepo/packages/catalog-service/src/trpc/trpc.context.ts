import type { Context } from '@app/shared';

/** Builds the per-request tRPC context. Minimal for the demo. */
export function createContext(): Context {
  return {};
}
