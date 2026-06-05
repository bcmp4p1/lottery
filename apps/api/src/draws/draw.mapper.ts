import { Draw } from '@lottery/shared';
import { DrawEntity } from '../database/entities/draw.entity';

export function toDrawDto(entity: DrawEntity, ticketsSold: number): Draw {
  return {
    id: entity.id,
    title: entity.title,
    description: entity.description,
    ticketPrice: entity.ticketPrice,
    drawDate: entity.drawDate.toISOString(),
    status: entity.status,
    maxTickets: entity.maxTickets,
    guaranteedWinner: entity.guaranteedWinner,
    winningNumber: entity.winningNumber,
    ticketsSold,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
