import { ApiProperty } from "@nestjs/swagger";

export class RegisterInvestmentGoalResponseDto {
  @ApiProperty({
    description: 'Mensagem de criação da meta de investimento',
    example: 'A meta de investimento foi cadastrada com sucesso'
  })
  message: string;
}