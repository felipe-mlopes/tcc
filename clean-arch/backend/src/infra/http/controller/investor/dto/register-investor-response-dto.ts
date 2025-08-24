import { ApiProperty } from "@nestjs/swagger";

export class RegisterInvestorResponseDto {
  @ApiProperty({
    description: 'Mensagem de criação de cadastro de investidor',
    example: 'O cadastro de investidor foi realizado com sucesso'
  })
  message: string;
}