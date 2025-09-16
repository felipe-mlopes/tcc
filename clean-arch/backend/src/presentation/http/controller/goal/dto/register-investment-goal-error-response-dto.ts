import { ApiProperty } from "@nestjs/swagger";

export class RegisterInvestmentGoalValidationErrorDto {
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
      'name: Nome deve ter pelo menos 3 caracteres',
      'targetAmount: Valor alvo deve ser positivo',
      'targetDate: Data alvo deve ser no futuro',
      'priority: Prioridade deve ser HIGH, MEDIUM ou LOW'
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
    example: '/investor/uuid-123-456-789/goals'
  })
  path: string;
}

export class RegisterInvestmentGoalBusinessErrorDto {
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
    example: '/investor/uuid-123-456-789/goals'
  })
  path: string;
}