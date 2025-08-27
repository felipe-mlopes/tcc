import { ApiProperty } from "@nestjs/swagger";

export class RegisterInvestorValidationErrorDto {
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
      'email: Email deve ter um formato válido',
      'cpf: CPF deve ter um formato válido',
      'name: Nome deve ter pelo menos 2 caracteres e conter apenas letras, espaços, hífens, pontos e números',
      'password: Senha deve ter no mínimo 6 caracteres',
      'password: Senha deve conter pelo menos uma letra maiúscula',
      'password: Senha deve conter pelo menos um símbolo',
      'dateOfBirth: Investidor deve ter pelo menos 18 anos'
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
    example: '/investor'
  })
  path: string;
}

export class RegisterInvestorBusinessErrorDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro de negócio',
    example: 'Email já está em uso por outro investidor'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/investor'
  })
  path: string;
}