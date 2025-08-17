import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGoalDto } from './create-goal.dto';

export class UpdateGoalDto extends PartialType(
  OmitType(CreateGoalDto, ['investorId'] as const),
) {}
