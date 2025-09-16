import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const addInvestmentToPortfolioBodySchema = z.object({
  assetId: z
    .string()
    .min(1, 'ID do ativo é obrigatório'),
  
  quantity: z
    .number()
    .positive('Quantidade deve ser um número positivo'),
  
  currentPrice: z
    .number()
    .positive('Preço atual deve ser um número positivo')
});

export class AddInvestmentToPortfolioDto extends createZodDto(addInvestmentToPortfolioBodySchema) {
  @ApiProperty({
    description: 'Identificador único do ativo a ser investido',
    example: 'PETR4',
    minLength: 1
  })
  assetId: string;

  @ApiProperty({
    description: 'Quantidade de cotas/ações a serem adquiridas',
    example: 100,
    minimum: 0.01
  })
  quantity: number;

  @ApiProperty({
    description: 'Preço unitário atual do ativo no momento da compra',
    example: 28.50,
    minimum: 0.01
  })
  currentPrice: number;
}