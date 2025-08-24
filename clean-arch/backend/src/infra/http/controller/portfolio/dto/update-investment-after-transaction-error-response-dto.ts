import { ApiProperty } from "@nestjs/swagger";

export class UpdateInvestmentAfterTransactionBusinessErrorDto {
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
    example: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
  })
  path: string;
}

export class UpdateInvestmentAfterTransactionForbiddenErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 403
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro de autorização/regra de negócio',
    example: 'Transação já foi processada anteriormente'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/investor/uuid-123-456-789/portfolio/investment/uuid-transaction-123-456/update'
  })
  path: string;
}