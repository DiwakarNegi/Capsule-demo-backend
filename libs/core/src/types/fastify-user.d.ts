import 'fastify';
import type { JwtUser } from '@app/core/guards/types';

declare module 'fastify' {
  interface FastifyRequest {
    user: JwtUser;
  }
}

export {};
