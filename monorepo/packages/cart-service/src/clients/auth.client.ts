import { Injectable } from '@nestjs/common';
import {
  createTRPCClient,
  httpBatchLink,
  type CreateTRPCClient,
} from '@trpc/client';
import type { WhoamiResult } from '@app/shared';
// Type-only import: we get full end-to-end type safety from auth-service's
// router, but NOTHING from auth-service's runtime crosses into this build.
import type { AuthRouter } from '@app/auth-service';
import { AppConfiguration } from '../config/app.configuration';

/**
 * Typed tRPC client for the auth service.
 *
 * Exposes the SAME method the monolith's AuthService exposes — `whoami(token)` —
 * so CartService's call site is identical to the monolith's. The only visible
 * difference is that it now returns a Promise: the call goes over HTTP.
 */
@Injectable()
export class AuthClient {
  private readonly client: CreateTRPCClient<AuthRouter>;

  constructor(config: AppConfiguration) {
    this.client = createTRPCClient<AuthRouter>({
      links: [httpBatchLink({ url: config.authUrl })],
    });
  }

  whoami(token: string): Promise<WhoamiResult> {
    return this.client.session.whoami.query({ token });
  }
}
