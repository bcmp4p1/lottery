import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketEntity } from '../database/entities/ticket.entity';
import { AuthModule } from '../auth/auth.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([TicketEntity]), AuthModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
