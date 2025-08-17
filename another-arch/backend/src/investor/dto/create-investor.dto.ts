import {
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  IsBoolean,
} from 'class-validator';

export class CreateInvestorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
