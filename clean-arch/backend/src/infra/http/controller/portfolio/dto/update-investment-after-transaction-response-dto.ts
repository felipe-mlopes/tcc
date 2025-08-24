import { ApiProperty } from "@nestjs/swagger";

export class UpdateInvestmentAfterTransactionResponseDto {
  @ApiProperty({
    description: 'Mensagem de atualização do investimento após a inclusão da transação',
    example: 'Após a inclusão da transação, o investimento foi atualizado com sucesso'
  })
  message: string;
}