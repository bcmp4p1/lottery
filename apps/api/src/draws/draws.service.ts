import { randomInt } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Draw, DrawStatus } from '@lottery/shared';
import { DrawEntity } from '../database/entities/draw.entity';
import { TicketEntity } from '../database/entities/ticket.entity';
import { CreateDrawDto } from './dto/create-draw.dto';
import { toDrawDto } from './draw.mapper';
import { DrawScheduler } from './draw-scheduler.service';

@Injectable()
export class DrawsService {
  constructor(
    @InjectRepository(DrawEntity)
    private readonly draws: Repository<DrawEntity>,
    @InjectRepository(TicketEntity)
    private readonly tickets: Repository<TicketEntity>,
    private readonly dataSource: DataSource,
    private readonly scheduler: DrawScheduler,
  ) {}

  /** Public listing: everything except drafts. */
  async listPublic(): Promise<Draw[]> {
    return this.list({ includeDrafts: false });
  }

  /** Admin listing: all draws including drafts. */
  async listAll(): Promise<Draw[]> {
    return this.list({ includeDrafts: true });
  }

  async getPublic(id: string): Promise<Draw> {
    const entity = await this.draws.findOne({ where: { id } });
    if (!entity || entity.status === DrawStatus.Draft) {
      throw new NotFoundException('Draw not found');
    }
    return toDrawDto(entity, await this.countTickets(id));
  }

  async create(dto: CreateDrawDto): Promise<Draw> {
    const entity = this.draws.create({
      title: dto.title,
      description: dto.description ?? '',
      ticketPrice: dto.ticketPrice,
      drawDate: new Date(dto.drawDate),
      maxTickets: dto.maxTickets,
      guaranteedWinner: dto.guaranteedWinner,
      status: DrawStatus.Draft,
      winningNumber: null,
    });
    const saved = await this.draws.save(entity);
    return toDrawDto(saved, 0);
  }

  async publish(id: string): Promise<Draw> {
    const draw = await this.transition(id, DrawStatus.Draft, DrawStatus.Open);
    // Schedule the auto-finalize to fire at the draw's date.
    await this.scheduler.scheduleFinalize(draw.id, new Date(draw.drawDate));
    return draw;
  }

  async close(id: string): Promise<Draw> {
    return this.transition(id, DrawStatus.Open, DrawStatus.Closed);
  }

  /** Manual admin draw: Closed -> Finished with a winning number. */
  async drawWinner(id: string): Promise<Draw> {
    const entity = await this.requireDraw(id);
    if (entity.status !== DrawStatus.Closed) {
      throw new ConflictException('Draw must be closed before drawing a winner');
    }
    const ticketsSold = await this.countTickets(id);
    entity.winningNumber = this.generateWinningNumber(entity, ticketsSold);
    entity.status = DrawStatus.Finished;
    const saved = await this.draws.save(entity);
    return toDrawDto(saved, ticketsSold);
  }

  /**
   * Auto-finalize called by the scheduled pg_cron callback: closes out an
   * Open/Closed draw and generates the winning number. Idempotent — a no-op for
   * Draft or already-Finished draws. Locks the row to stay safe vs. a concurrent
   * manual draw/purchase.
   */
  async finalize(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const draw = await manager.findOne(DrawEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!draw) return;
      if (draw.status === DrawStatus.Draft || draw.status === DrawStatus.Finished) {
        return;
      }
      const ticketsSold = await manager.count(TicketEntity, { where: { drawId: id } });
      draw.winningNumber = this.generateWinningNumber(draw, ticketsSold);
      draw.status = DrawStatus.Finished;
      await manager.save(draw);
    });
  }

  async remove(id: string): Promise<void> {
    const entity = await this.requireDraw(id);
    const ticketsSold = await this.countTickets(id);
    if (ticketsSold > 0) {
      throw new ConflictException('Cannot delete a draw that already has tickets');
    }
    await this.draws.remove(entity);
    await this.scheduler.cancelFinalize(id);
  }

  private async transition(
    id: string,
    from: DrawStatus,
    to: DrawStatus,
  ): Promise<Draw> {
    const entity = await this.requireDraw(id);
    if (entity.status !== from) {
      throw new ConflictException(
        `Draw must be '${from}' to become '${to}' (current: '${entity.status}')`,
      );
    }
    entity.status = to;
    const saved = await this.draws.save(entity);
    return toDrawDto(saved, await this.countTickets(id));
  }

  private async requireDraw(id: string): Promise<DrawEntity> {
    const entity = await this.draws.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Draw not found');
    return entity;
  }

  private async countTickets(drawId: string): Promise<number> {
    return this.tickets.count({ where: { drawId } });
  }

  /**
   * - guaranteedWinner: pick uniformly from sold numbers [1, ticketsSold] (always a winner).
   * - otherwise: pick from the pool [1, maxTickets]; if it exceeds ticketsSold, no winner.
   * - no tickets sold: no winning number.
   */
  private generateWinningNumber(draw: DrawEntity, ticketsSold: number): number | null {
    if (ticketsSold <= 0) return null;
    const upperExclusive = draw.guaranteedWinner ? ticketsSold + 1 : draw.maxTickets + 1;
    return randomInt(1, upperExclusive);
  }

  private async list({ includeDrafts }: { includeDrafts: boolean }): Promise<Draw[]> {
    const qb = this.draws.createQueryBuilder('d').orderBy('d.draw_date', 'DESC');
    if (!includeDrafts) {
      qb.where('d.status != :draft', { draft: DrawStatus.Draft });
    }
    const entities = await qb.getMany();

    if (entities.length === 0) return [];

    const counts = await this.tickets
      .createQueryBuilder('t')
      .select('t.draw_id', 'drawId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.draw_id')
      .getRawMany<{ drawId: string; count: string }>();

    const countMap = new Map(counts.map((c) => [c.drawId, Number(c.count)]));
    return entities.map((e) => toDrawDto(e, countMap.get(e.id) ?? 0));
  }
}
