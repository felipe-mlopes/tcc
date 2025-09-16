import { ApiProperty } from "@nestjs/swagger";

export class DeactivateInvestorResponseDto {
  @ApiProperty({
    description: 'Mensagem de inativação de cadastro de investidor',
    example: 'Investidor desativado com sucesso'
  })
  message: string;
}