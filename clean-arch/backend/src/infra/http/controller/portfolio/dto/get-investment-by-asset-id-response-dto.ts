import { ApiProperty } from "@nestjs/swagger";

export class GetInvestmentByAssetIdResponseDto {
  @ApiProperty({
    description: 'ID único do investimento',
    example: 'uuid-investment-123-456'
  })
  id: string;

  @ApiProperty({
    description: 'ID do ativo investido',
    example: 'PETR4'
  })
  assetId: string;

  @ApiProperty({
    description: 'ID do portfólio onde está o investimento',
    example: 'uuid-portfolio-789'
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Quantidade total de cotas/ações em carteira',
    example: 150
  })
  quantity: number;

  @ApiProperty({
    description: 'Último preço de mercado do ativo',
    example: 32.50
  })
  currentPrice: number;
}