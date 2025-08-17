import { IsBoolean } from 'class-validator';

export class DeactivateInvestorDto {
  @IsBoolean()
  isActive: boolean;
}
