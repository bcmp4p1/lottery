import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@lottery/shared';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DrawsService } from './draws.service';
import { CreateDrawDto } from './dto/create-draw.dto';

@Controller()
export class DrawsController {
  constructor(private readonly draws: DrawsService) {}

  @Get('draws')
  listPublic() {
    return this.draws.listPublic();
  }

  @Get('draws/:id')
  getPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.getPublic(id);
  }

  @Get('admin/draws')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  listAll() {
    return this.draws.listAll();
  }

  @Post('admin/draws')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateDrawDto) {
    return this.draws.create(dto);
  }

  @Post('admin/draws/:id/publish')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.publish(id);
  }

  @Post('admin/draws/:id/close')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  close(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.close(id);
  }

  @Post('admin/draws/:id/draw')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  drawWinner(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.drawWinner(id);
  }

  @Delete('admin/draws/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.draws.remove(id);
  }
}
