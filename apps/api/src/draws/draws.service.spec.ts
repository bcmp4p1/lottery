import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DrawStatus } from '@lottery/shared';
import { DrawEntity } from '../database/entities/draw.entity';
import { TicketEntity } from '../database/entities/ticket.entity';
import { DrawsService } from './draws.service';

function makeDraw(overrides: Partial<DrawEntity> = {}): DrawEntity {
  return {
    id: 'draw-1',
    title: 'Test',
    description: '',
    ticketPrice: 100,
    drawDate: new Date('2030-01-01T00:00:00Z'),
    status: DrawStatus.Closed,
    maxTickets: 100,
    guaranteedWinner: true,
    winningNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tickets: [],
    ...overrides,
  } as DrawEntity;
}

describe('DrawsService.drawWinner', () => {
  let service: DrawsService;
  let draw: DrawEntity;
  let ticketsSold: number;
  let drawsRepo: jest.Mocked<Pick<Repository<DrawEntity>, 'findOne' | 'save'>>;
  let ticketsRepo: jest.Mocked<Pick<Repository<TicketEntity>, 'count'>>;

  beforeEach(() => {
    draw = makeDraw();
    ticketsSold = 10;
    drawsRepo = {
      findOne: jest.fn(async () => draw),
      save: jest.fn(async (e: DrawEntity) => e),
    } as never;
    ticketsRepo = {
      count: jest.fn(async () => ticketsSold),
    } as never;
    service = new DrawsService(
      drawsRepo as never,
      ticketsRepo as never,
      {} as never, // DataSource (unused by drawWinner)
      {} as never, // DrawScheduler (unused by drawWinner)
    );
  });

  it('rejects drawing a winner unless the draw is closed', async () => {
    draw.status = DrawStatus.Open;
    await expect(service.drawWinner('draw-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('finishes with no winning number when no tickets were sold', async () => {
    ticketsSold = 0;
    const result = await service.drawWinner('draw-1');
    expect(result.winningNumber).toBeNull();
    expect(result.status).toBe(DrawStatus.Finished);
  });

  it('guaranteed winner: number is always within [1, ticketsSold]', async () => {
    draw.guaranteedWinner = true;
    ticketsSold = 7;
    for (let i = 0; i < 200; i++) {
      draw.winningNumber = null;
      draw.status = DrawStatus.Closed;
      const result = await service.drawWinner('draw-1');
      expect(result.winningNumber).toBeGreaterThanOrEqual(1);
      expect(result.winningNumber!).toBeLessThanOrEqual(7);
    }
  });

  it('chance-based: number is within [1, maxTickets] and can exceed ticketsSold', async () => {
    draw.guaranteedWinner = false;
    draw.maxTickets = 50;
    ticketsSold = 5;
    let sawNoWinner = false;
    for (let i = 0; i < 500; i++) {
      draw.winningNumber = null;
      draw.status = DrawStatus.Closed;
      const result = await service.drawWinner('draw-1');
      expect(result.winningNumber!).toBeGreaterThanOrEqual(1);
      expect(result.winningNumber!).toBeLessThanOrEqual(50);
      if (result.winningNumber! > ticketsSold) sawNoWinner = true;
    }
    // With 5/50 sold, the vast majority of draws map to an unsold number.
    expect(sawNoWinner).toBe(true);
  });

  it('transitions the draw to Finished', async () => {
    const result = await service.drawWinner('draw-1');
    expect(result.status).toBe(DrawStatus.Finished);
    expect(drawsRepo.save).toHaveBeenCalled();
  });
});
