import { TransactionType } from "@/domain/transaction/entities/transaction";
import { ApiPropertyOptional } from "@nestjs/swagger";
// import { TransactionType } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";


const updateTransactionBodySchema = z.object({
  transactionType: z
    .enum(Object.values(TransactionType), {
      message: `Tipo de transação deve ser ${Object.values(TransactionType).join(", ")}` 
    })
    .optional(),
  
  quantity: z
    .number()
    .positive('Quantidade deve ser um número positivo')
    .optional(),
  
  price: z
    .number()
    .positive('Preço deve ser um número positivo')
    .optional(),
  
  fees: z
    .number()
    .min(0, 'Taxas não podem ser negativas')
    .optional()
}).refine((data) => {
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'Pelo menos um campo deve ser fornecido para atualização',
  path: ['body']
});

export class UpdateTransactionDto extends createZodDto(updateTransactionBodySchema) {
  @ApiPropertyOptional({
    description: 'Tipo da transação',
    example: 'Buy',
    enum: TransactionType,
    enumName: 'TransactionType'
  })
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    description: 'Nova quantidade de cotas/ações',
    example: 150,
    minimum: 0.01
  })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Novo preço unitário',
    example: 32.75,
    minimum: 0.01
  })
  price?: number;

  @ApiPropertyOptional({
    description: 'Novas taxas da operação',
    example: 15.50,
    minimum: 0
  })
  fees?: number;
}