import { ApiProperty } from "@nestjs/swagger";

export class FetchAllInvestmentByPortfolioIdBusinessErrorDto {
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
    example: '/uuid-123-456-789/portfolio/investment/PETR4'
  })
  path: string;
}