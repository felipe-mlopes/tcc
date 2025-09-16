import { ApiProperty } from "@nestjs/swagger";

export class AddInvestmentToPortfolioResponseDto {
  @ApiProperty({
    description: 'Mensagem de inclusão de investimento ao portfólio',
    example: 'O investimento foi adicionado ao portfólio com sucesso'
  })
  message: string;
}