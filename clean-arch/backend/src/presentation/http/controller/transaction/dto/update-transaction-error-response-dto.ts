import { ApiProperty } from "@nestjs/swagger";

export class UpdateTransactionValidationErrorDto {
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
      'transactionType: Tipo de transação deve ser BUY ou SELL',
      'quantity: Quantidade deve ser um número positivo',
      'price: Preço deve ser um número positivo',
      'fees: Taxas não podem ser negativas'
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
    example: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
  })
  path: string;
}

export class UpdateTransactionBusinessErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro de regra de negócio',
    example: 'Transação já confirmada não pode ser alterada'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
  })
  path: string;
}

export class UpdateTransactionNotFoundErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 404
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Transação não encontrada'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/uuid-123-456-789/transaction/uuid-transaction-123-456'
  })
  path: string;
}