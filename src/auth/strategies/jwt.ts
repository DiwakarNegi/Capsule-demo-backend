import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import jwtConfig from '@config/jwt';
import type { AuthPrincipalType, JwtUser } from '@app/core/guards/types';

interface JwtPayload {
  sub: string;
  username: string;
  type?: AuthPrincipalType;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(getConfigToken('jwt'))
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.secret,
    });
  }

  /**
   * Maps JWT claims to request.user.
   * `type` distinguishes admin vs user principals for guards and services.
   */
  validate(payload: JwtPayload): JwtUser {
    return {
      sub: payload.sub,
      username: payload.username,
      type: payload.type,
    };
  }
}
