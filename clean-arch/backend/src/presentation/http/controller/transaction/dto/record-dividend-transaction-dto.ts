import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const recordDividendTransactionBodySchema = z.object({
    assetId: z
        .string()
        .min(1, 'ID do ativo é obrigatório'),
  
    quantity: z
        .number()
        .positive('Quantidade deve ser um número positivo'),
  
    price: z
        .number()
        .positive('Preço deve ser um número positivo'),
  
    income: z
        .number()
        .positive('Proventos devem ser um número positivo'),
  
    dateAt: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)), { message: 'Data deve estar em formato válido (ISO 8601)' }
    )
    .refine(
      (val) => new Date(val) <= new Date(), { message: 'Data da transação não pode ser no futuro' }
    )
    .transform((val) => new Date(val))
})

export class RecordDividendTransactionDto extends createZodDto(recordDividendTransactionBodySchema) {
  @ApiProperty({
    description: 'Identificador único do ativo a ser investido',
    example: 'uuid-123-456-789',
    minLength: 1
  })
  assetId: string;

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

  @ApiProperty({
    description: 'Proventos recebidos',
    example: 12.90,
    minimum: 0.01
  })
  income: number;

  @ApiProperty({
    description: 'Data e hora em que a transação foi executada (não pode ser no futuro)',
    example: '2024-01-15T14:30:00Z',
    type: 'string',
    format: 'date-time'
  })
  dateAt: Date;
}