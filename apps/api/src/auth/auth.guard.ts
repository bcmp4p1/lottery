import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth-user';

/**
 * Verifies the Supabase access token (JWT) using the project's public JWKS, then
 * resolves the user's role from the `profiles` table (the source of truth for
 * authorization). Attaches an `AuthUser` to `request.user`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    const jwksUrl = config.getOrThrow<string>('SUPABASE_JWKS_URL');
    this.issuer = config.getOrThrow<string>('SUPABASE_JWT_ISSUER');
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice('Bearer '.length).trim();

    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      }));
    } catch (err) {
      this.logger.debug(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }

    const id = String(payload.sub);
    const email = typeof payload.email === 'string' ? payload.email : '';
    request.user = {
      id,
      email,
      role: await this.authService.resolveRole(id, email),
    } satisfies AuthUser;
    return true;
  }
}
