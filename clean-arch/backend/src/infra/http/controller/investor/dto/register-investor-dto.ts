import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { CPF } from "@/core/value-objects/cpf";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";

const registerInvestorBodySchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .refine((email) => {
      try {
        Email.create(email);
        return true;
      } catch (error) {
        return false;
      }
    }, 'Email deve ter um formato válido')
    .transform((email) => Email.create(email).getValue()),
  
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .refine((name) => {
      try {
        Name.create(name);
        return true;
      } catch (error) {
        return false;
      }
    }, 'Nome deve ter pelo menos 2 caracteres e conter apenas letras, espaços, hífens, pontos e números')
    .transform((name) => Name.create(name).getValue()),
  
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .refine((cpf) => {
      try {
        CPF.create(cpf);
        return true;
      } catch (error) {
        return false;
      }
    }, 'CPF deve ter um formato válido')
    .transform((cpf) => CPF.create(cpf).getValue()),
  
  dateOfBirth: z
    .iso
    .date({ message: 'Data de nascimento deve estar em formato válido (ISO 8601)' })
    .transform((dateStr) => new Date(dateStr))
    .refine((date) => DateOfBirth.isValid(date), {
      message: 'Data de nascimento inválida: deve ser no passado e o investidor deve ter pelo menos 18 anos',
    })
    .transform((date) => DateOfBirth.create(date).getValue())
});

export class RegisterInvestorDto extends createZodDto(registerInvestorBodySchema) {
  @ApiProperty({
    description: 'Email único do investidor (será validado usando a classe Email)',
    example: 'joao.silva@email.com',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    description: 'Nome completo do investidor (será validado usando a classe Name)',
    example: 'João Silva Santos',
    minLength: 2,
    pattern: '^[A-Za-zÀ-ÖØ-öø-ÿ\\s\\-\'\\.0-9º°ª]+$'
  })
  name: string;

  @ApiProperty({
    description: 'CPF do investidor (será validado usando a classe CPF - aceita com ou sem formatação)',
    example: '12345678901',
    pattern: '^\\d{11}$|^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$'
  })
  cpf: string;

  @ApiProperty({
    description: 'Data de nascimento do investidor (será validada usando a classe DateOfBirth - deve ter pelo menos 18 anos)',
    example: '1990-05-15',
    type: 'string',
    format: 'date',
  })
  dateOfBirth: Date;
}