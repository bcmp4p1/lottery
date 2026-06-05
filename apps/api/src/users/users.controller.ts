import { Controller, Get, UseGuards } from '@nestjs/common';
import type { PublicUser } from '@lottery/shared';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';

@Controller()
@UseGuards(AuthGuard)
export class UsersController {
  /** Current user with the role resolved from the DB (source of truth). */
  @Get('me')
  me(@CurrentUser() user: AuthUser): PublicUser {
    return { id: user.id, email: user.email, role: user.role };
  }
}
