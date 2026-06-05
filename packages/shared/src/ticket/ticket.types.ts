import { Draw } from '../draw/draw.types';

export interface Ticket {
  id: string;
  drawId: string;
  userId: string;
  ticketNumber: number;
  createdAt: string;
}

export interface TicketWithResult extends Ticket {
  isWinner: boolean;
  draw: Pick<Draw, 'id' | 'title' | 'status' | 'winningNumber' | 'drawDate'>;
}
