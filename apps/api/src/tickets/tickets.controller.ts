import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth-user';
import { TicketsService } from './tickets.service';

@Controller()
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post('draws/:drawId/tickets')
  purchase(
    @Param('drawId', ParseUUIDPipe) drawId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tickets.purchase(drawId, user.id);
  }

  @Get('me/tickets')
  myTickets(@CurrentUser() user: AuthUser) {
    return this.tickets.listForUser(user.id);
  }
}
