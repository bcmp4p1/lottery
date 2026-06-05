import { Controller, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { InternalGuard } from '../auth/internal.guard';
import { DrawsService } from './draws.service';

/** Machine-to-machine endpoints, authenticated by a shared secret (not a user JWT). */
@Controller('internal')
@UseGuards(InternalGuard)
export class InternalController {
  constructor(private readonly draws: DrawsService) {}

  @Post('draws/:id/finalize')
  @HttpCode(200)
  finalize(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.finalize(id);
  }
}
