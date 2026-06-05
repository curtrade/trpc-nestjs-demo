/**
 * Per-request tRPC context, shared by every service.
 *
 * Kept minimal for the demo. A real app might carry the authenticated user, a
 * request id, a logger, a DB transaction handle, etc. Each service supplies a
 * `createContext` function to its tRPC adapter in main.ts.
 */
export interface Context {
  requestId?: string;
}
