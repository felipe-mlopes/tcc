import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { Priority } from "@/domain/goal/entities/goal";

const registerInvestmentGoalBodySchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
  
  description: z
    .string()
    .optional(),
  
  targetAmount: z
    .number()
    .positive('Valor alvo deve ser positivo'),
  
  targetDate: z
    .iso
    .date({ message: 'Data alvo deve estar em formato válido (ISO 8601)' })
    .transform((val) => new Date(val))
    .refine((date) => date > new Date(), {
      message: 'Data alvo deve ser no futuro'
    }),
  
  priority: z
    .enum(Object.values(Priority), {
       message: `Prioridade deve ser um dos: ${Object.values(Priority).join(", ")}` 
    })
});

export class RegisterInvestmentGoalDto extends createZodDto(registerInvestmentGoalBodySchema) {
  @ApiProperty({
    description: 'Nome da meta de investimento',
    example: 'Comprar casa própria',
    minLength: 3
  })
  name: string;

  @ApiProperty({
    description: 'Descrição opcional da meta',
    example: 'Meta para conseguir dar entrada na casa própria',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Valor alvo da meta em reais',
    example: 150000.00,
    minimum: 0.01
  })
  targetAmount: number;

  @ApiProperty({
    description: 'Data alvo para alcançar a meta (deve ser no futuro)',
    example: '2025-12-31',
    type: 'string',
    format: 'date'
  })
  targetDate: Date;

  @ApiProperty({
    description: 'Prioridade da meta',
    example: 'HIGH',
    enum: Priority,
    enumName: 'Priority'
  })
  priority: Priority;
}