import { ApiProperty } from "@nestjs/swagger";

export class CreatePortfolioResponseDto {
  @ApiProperty({
    description: 'Mensagem de criação de portfólio',
    example: 'O portfólio foi criado com sucesso'
  })
  message: string;
}