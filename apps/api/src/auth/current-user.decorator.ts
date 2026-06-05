import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './auth-user';

/** Injects the authenticated user (set by AuthGuard) into a handler param. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest().user,
);
