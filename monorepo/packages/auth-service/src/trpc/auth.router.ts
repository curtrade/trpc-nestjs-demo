import {
  publicProcedure,
  router,
  whoamiInput,
  whoamiOutput,
} from '@app/shared';
import type { AuthService } from '../auth/auth.service';

/**
 * Build the auth tRPC router around an AuthService instance.
 *
 * The router is deliberately thin: it only adapts tRPC input/output to a call on
 * the injected service. All business logic stays in AuthService — exactly the
 * service the monolith calls directly. main.ts pulls AuthService out of the
 * Nest DI container and passes it here.
 */
export function createAuthRouter(auth: AuthService) {
  return router({
    session: router({
      whoami: publicProcedure
        .input(whoamiInput)
        .output(whoamiOutput)
        .query(({ input }) => auth.whoami(input.token)),
    }),
  });
}

/**
 * The exported router *type*. Other services import this with `import type` and
 * build a typed client — no runtime dependency on auth-service crosses the wire.
 */
export type AuthRouter = ReturnType<typeof createAuthRouter>;
