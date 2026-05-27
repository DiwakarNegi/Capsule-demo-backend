/** Principal kind encoded in JWT — keeps user and admin tokens unambiguous. */
export type AuthPrincipalType = 'user' | 'admin';

export interface JwtUser {
  sub: string;
  username: string;
  /** Present on tokens issued after auth separation; omitted on legacy tokens (treated as user). */
  type?: AuthPrincipalType;
}
