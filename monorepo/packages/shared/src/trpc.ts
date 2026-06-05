import { initTRPC } from '@trpc/server';
import type { Context } from './context';

/**
 * The single tRPC instance shared by every service.
 *
 * Each service builds its own router from `router` + `publicProcedure`, then
 * exports the router *type* (`typeof appRouter`). Callers import that type only
 * (`import type`) and build a typed client — so types flow across services at
 * compile time while the runtime stays fully decoupled (HTTP).
 */
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
