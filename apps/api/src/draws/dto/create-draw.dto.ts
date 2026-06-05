import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDrawDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  /** Ticket price in the smallest currency unit (e.g. cents). */
  @IsInt()
  @Min(0)
  ticketPrice!: number;

  @IsISO8601()
  drawDate!: string;

  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxTickets!: number;

  @IsBoolean()
  guaranteedWinner!: boolean;
}
