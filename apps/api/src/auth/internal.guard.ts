import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guards machine-to-machine endpoints (e.g. the pg_cron finalize callback).
 * Authenticates a shared secret in the `x-internal-secret` header rather than a
 * user JWT, with a timing-safe comparison.
 */
@Injectable()
export class InternalGuard implements CanActivate {
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('INTERNAL_FINALIZE_SECRET');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = String(request.headers?.['x-internal-secret'] ?? '');
    const a = Buffer.from(provided);
    const b = Buffer.from(this.secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    return true;
  }
}
