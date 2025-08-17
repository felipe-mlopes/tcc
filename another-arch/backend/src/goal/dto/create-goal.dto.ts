import {
  IsString,
  IsOptional,
  IsDecimal,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { GoalPriority, GoalCategory } from '@prisma/client';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }: { value: string | number }) =>
    typeof value === 'number' ? value : parseFloat(value),
  )
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0.01)
  targetAmount: number;

  @IsDateString()
  targetDate: string;

  @IsEnum(GoalPriority)
  @IsOptional()
  priority?: GoalPriority = GoalPriority.MEDIUM;

  @IsEnum(GoalCategory)
  category: GoalCategory;

  @IsString()
  @IsNotEmpty()
  investorId: string;
}
