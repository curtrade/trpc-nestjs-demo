import { z } from 'zod';

/**
 * Domain schemas and types shared across services.
 *
 * These deliberately match the monolith's contracts one-for-one:
 *   whoami:  (token)      -> { userId } | null
 *   item.byId: (id)       -> Item | null
 *
 * That parity is the whole point — the Cart call sites look identical to the
 * monolith; only the transport (tRPC over HTTP) differs.
 */

// ---- Auth domain ----
export const whoamiInput = z.object({ token: z.string() });
export type WhoamiInput = z.infer<typeof whoamiInput>;

export const whoamiOutput = z.object({ userId: z.string() }).nullable();
export type WhoamiResult = z.infer<typeof whoamiOutput>;

// ---- Catalog domain ----
export const itemByIdInput = z.object({ id: z.string() });
export type ItemByIdInput = z.infer<typeof itemByIdInput>;

export const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Price in minor units (cents). */
  price: z.number().int(),
  inStock: z.boolean(),
});
export type Item = z.infer<typeof itemSchema>;

export const itemByIdOutput = itemSchema.nullable();
export type ItemResult = z.infer<typeof itemByIdOutput>;
