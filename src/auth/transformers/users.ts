import { Users } from '@app/src/users/entities';
import { Admins } from '@app/src/users/entities/admins';
import { UserTransformer } from '@app/src/users/transformers';
import { AdminTransformer } from '@app/src/users/transformers/admins';
import { Injectable } from '@nestjs/common';

type Tokens = { accessToken: string; refreshToken?: string | null };

interface AuthResponse {
  message?: string;
  tokens?: Tokens;
  /** User (vendor) login response */
  user?: Users;
  /** Admin login response — separate table, separate JWT type */
  admin?: Admins;
}

@Injectable()
export class AuthTransformer {
  constructor(
    private readonly userTransformer: UserTransformer,
    private readonly adminTransformer: AdminTransformer,
  ) {}

  async transform(response: AuthResponse) {
    if ('message' in response && response.message) {
      return { message: response.message };
    }

    if (response.admin) {
      // API key `user` kept for backward compatibility with existing admin clients.
      const profile = await this.adminTransformer.transform(response.admin);
      return {
        tokens: response.tokens,
        user: profile,
        admin: profile,
      };
    }

    return {
      tokens: response.tokens,
      user: await this.userTransformer.transform(response.user!),
    };
  }
}
