import { IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateInvestmentDto {
  @IsString()
  portfolioId: string;

  @IsString()
  assetId: string;

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
  averagePrice: number;

  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsNumber()
  @Min(0)
  totalInvested: number;
}
