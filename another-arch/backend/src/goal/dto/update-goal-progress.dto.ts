import { IsDecimal, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGoalProgressDto {
  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  currentAmount: number;
}
