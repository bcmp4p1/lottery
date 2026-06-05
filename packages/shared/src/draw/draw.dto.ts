export interface CreateDrawDto {
  title: string;
  description: string;
  ticketPrice: number;
  drawDate: string;
  maxTickets: number;
  guaranteedWinner: boolean;
}
