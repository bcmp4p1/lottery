import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DrawStatus, UserRole } from '@lottery/shared';
import { DrawEntity } from '../database/entities/draw.entity';
import { TicketEntity } from '../database/entities/ticket.entity';
import { TicketsService } from './tickets.service';
import type { AuthUser } from '../auth/auth-user';

const USER: AuthUser = { id: 'user-1', email: 'a@b.com', role: UserRole.User };

function buildService(opts: {
  draw: DrawEntity | null;
  sold: number;
}) {
  const manager = {
    findOne: jest.fn(async () => opts.draw),
    count: jest.fn(async () => opts.sold),
    query: jest.fn(async () => undefined),
    create: jest.fn((_e: unknown, data: Partial<TicketEntity>) => ({
      id: 'ticket-1',
      createdAt: new Date(),
      ...data,
    })),
    save: jest.fn(async (t: TicketEntity) => t),
  };
  const dataSource = {
    transaction: jest.fn(async (cb: (m: typeof manager) => unknown) => cb(manager)),
  } as unknown as DataSource;

  const service = new TicketsService(dataSource, {} as never);
  return { service, manager };
}

function makeDraw(overrides: Partial<DrawEntity> = {}): DrawEntity {
  return {
    id: 'draw-1',
    status: DrawStatus.Open,
    maxTickets: 100,
    drawDate: new Date(Date.now() + 86_400_000),
    ...overrides,
  } as DrawEntity;
}

describe('TicketsService.purchase', () => {
  it('throws NotFound when the draw does not exist', async () => {
    const { service } = buildService({ draw: null, sold: 0 });
    await expect(service.purchase('draw-1', USER.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when the draw is not open', async () => {
    const { service } = buildService({
      draw: makeDraw({ status: DrawStatus.Closed }),
      sold: 0,
    });
    await expect(service.purchase('draw-1', USER.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the draw date has passed', async () => {
    const { service } = buildService({
      draw: makeDraw({ drawDate: new Date(Date.now() - 1000) }),
      sold: 0,
    });
    await expect(service.purchase('draw-1', USER.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when the draw is sold out', async () => {
    const { service } = buildService({
      draw: makeDraw({ maxTickets: 5 }),
      sold: 5,
    });
    await expect(service.purchase('draw-1', USER.id)).rejects.toBeInstanceOf(ConflictException);
  });

  it('assigns the next sequential ticket number (sold + 1)', async () => {
    const { service } = buildService({ draw: makeDraw(), sold: 3 });
    const ticket = await service.purchase('draw-1', USER.id);
    expect(ticket.ticketNumber).toBe(4);
    expect(ticket.userId).toBe(USER.id);
    expect(ticket.drawId).toBe('draw-1');
  });

  it('locks the draw row for update', async () => {
    const { service, manager } = buildService({ draw: makeDraw(), sold: 0 });
    await service.purchase('draw-1', USER.id);
    expect(manager.findOne).toHaveBeenCalledWith(
      DrawEntity,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });
});
