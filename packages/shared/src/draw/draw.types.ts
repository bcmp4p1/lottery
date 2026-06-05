import { DrawStatus } from './draw.enums';

export interface Draw {
  id: string;
  title: string;
  description: string;
  ticketPrice: number;
  drawDate: string;
  status: DrawStatus;
  maxTickets: number;
  guaranteedWinner: boolean;
  winningNumber: number | null;
  ticketsSold: number;
  createdAt: string;
  updatedAt: string;
}
