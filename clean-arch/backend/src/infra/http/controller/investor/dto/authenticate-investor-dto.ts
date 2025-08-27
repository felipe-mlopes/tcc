import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { Email } from "@/core/value-objects/email";

const authenticateInvestorBodySchema = z.object({
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

  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .refine((password) => /[A-Z]/.test(password), 'Senha deve conter pelo menos uma letra maiúscula')
    .refine((password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), 'Senha deve conter pelo menos um símbolo'),
});

export class AuthenticateInvestorDto extends createZodDto(authenticateInvestorBodySchema) {
  @ApiProperty({
    description: 'Email único do investidor (será validado usando a classe Email)',
    example: 'joao.silva@email.com',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    description: 'Senha do investidor (mínimo 6 caracteres, pelo menos 1 letra maiúscula e 1 símbolo)',
    example: 'MinhaSenh@123',
    type: 'string',
    format: 'password',
    minLength: 6,
    pattern: '^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{6,}'
  })
  password: string;

}