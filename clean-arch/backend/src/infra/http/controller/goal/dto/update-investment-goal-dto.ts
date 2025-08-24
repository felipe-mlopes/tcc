import { ApiPropertyOptional } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

import { Priority, Status } from "@/domain/goal/entities/goal";

const updateInvestmentGoalBodySchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .optional(),

    description: z
        .string()
        .optional(),

    targetAmount: z
        .number()
        .positive('Valor alvo deve ser positivo')
        .optional(),

    targetDate: z
        .iso
        .date({ message: 'Data alvo deve estar em formato válido (ISO 8601)' })
        .transform((val) => new Date(val))
        .refine((date) => date > new Date(), {
          message: 'Data alvo deve ser no futuro'
        })
        .optional(),

    priority: z
        .enum(Object.values(Priority), {
        message: `Prioridade deve ser um dos: ${Object.values(Priority).join(", ")}` 
        })
        .optional(),

    status: z
        .enum(Object.values(Status), {
            message: `Status deve ser um dos: ${Object.values(Status).join(", ")}` 
        })
        .optional()
}).refine((data) => {
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
  path: ['body']
});

export class UpdateInvestmentGoalDto extends createZodDto(updateInvestmentGoalBodySchema) {
  @ApiPropertyOptional({
    description: 'Nome da meta de investimento',
    example: 'Comprar apartamento novo',
    minLength: 3
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Descrição da meta',
    example: 'Meta atualizada para comprar apartamento de 2 quartos'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Valor alvo da meta em reais',
    example: 200000.00,
    minimum: 0.01
  })
  targetAmount?: number;

  @ApiPropertyOptional({
    description: 'Data alvo para alcançar a meta (deve ser no futuro)',
    example: '2025-12-31',
    type: 'string',
    format: 'date'
  })
  targetDate?: Date;

  @ApiPropertyOptional({
    description: 'Prioridade da meta',
    example: 'HIGH',
    enum: Priority,
    enumName: 'Priority'
  })
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Status da meta',
    example: 'ACTIVE',
    enum: Status,
    enumName: 'Status'
  })
  status?: Status;
}