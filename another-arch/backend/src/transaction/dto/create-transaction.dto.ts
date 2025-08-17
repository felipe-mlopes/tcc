import {
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  investmentId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  quantity: number;

  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  price: number;

  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsDateString()
  executedAt: string;
}
