import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawEntity } from '../database/entities/draw.entity';
import { TicketEntity } from '../database/entities/ticket.entity';
import { AuthModule } from '../auth/auth.module';
import { InternalGuard } from '../auth/internal.guard';
import { DrawsController } from './draws.controller';
import { InternalController } from './internal.controller';
import { DrawsService } from './draws.service';
import { DrawScheduler } from './draw-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([DrawEntity, TicketEntity]), AuthModule],
  controllers: [DrawsController, InternalController],
  providers: [DrawsService, DrawScheduler, InternalGuard],
})
export class DrawsModule {}
