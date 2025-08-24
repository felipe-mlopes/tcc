import { ApiProperty } from "@nestjs/swagger";

export class RegisterAssetErrorResponseDto {
  @ApiProperty({
    description: 'Código do status HTTP',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Validation failed'
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/asset'
  })
  path: string;

  @ApiProperty({
    description: 'Detalhes específicos do erro',
    example: ['symbol must be at least 3 characters'],
    required: false
  })
  details?: string[];
}