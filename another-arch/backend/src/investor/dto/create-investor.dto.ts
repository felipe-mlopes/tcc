import {
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateInvestorDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsString()
  dateOfBirth: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
