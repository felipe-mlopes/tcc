import { z } from "zod";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";

const recordTransactionBodySchema = z.object({
  assetName: z
    .string()
    .min(3, 'Nome do ativo deve ter pelo menos 3 caracteres'),
  
  quantity: z
    .number()
    .positive('Quantidade deve ser um número positivo'),
  
  price: z
    .number()
    .positive('Preço deve ser um número positivo'),
  
  fees: z
    .number()
    .positive('Taxas devem ser um número positivo')
    .optional(),

  dateAt: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)), { message: 'Data deve estar em formato válido (ISO 8601)' }
    )
    .refine(
      (val) => new Date(val) <= new Date(), { message: 'Data da transação não pode ser no futuro' }
    )
    .transform((val) => new Date(val))
});

  
export class RecordTransactionDto extends createZodDto(recordTransactionBodySchema) {
  @ApiProperty({
    description: 'Nome/código do ativo a ser comprado',
    example: 'PETR4',
    minLength: 3
  })
  assetName: string;

  @ApiProperty({
    description: 'Quantidade de cotas/ações a serem compradas',
    example: 100,
    minimum: 0.01
  })
  quantity: number;

  @ApiProperty({
    description: 'Preço unitário pago pelo ativo',
    example: 28.50,
    minimum: 0.01
  })
  price: number;

  @ApiPropertyOptional({
    description: 'Taxas adicionais da operação (corretagem, custódia, etc)',
    example: 12.90,
    minimum: 0.01
  })
  fees?: number;

  @ApiProperty({
    description: 'Data e hora em que a transação foi executada (não pode ser no futuro)',
    example: '2024-01-15T14:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  dateAt: Date;
}