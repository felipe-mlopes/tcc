import { ApiProperty } from "@nestjs/swagger";

export class AddInvestmentToPortfolioValidationErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem principal do erro',
    example: 'Validation failed'
  })
  message: string;

  @ApiProperty({
    description: 'Lista de erros específicos de validação',
    example: [
      'assetId: ID do ativo é obrigatório',
      'quantity: Quantidade deve ser um número positivo',
      'currentPrice: Preço atual deve ser um número positivo'
    ],
    type: [String]
  })
  details: string[];

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/investor/uuid-123-456-789/portfolio/investment'
  })
  path: string;
}

export class AddInvestmentToPortfolioBusinessErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 404
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro de negócio',
    example: 'Investidor não encontrado'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/investor/uuid-123-456-789/portfolio/investment'
  })
  path: string;
}