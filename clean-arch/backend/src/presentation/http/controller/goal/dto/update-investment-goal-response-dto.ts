import { ApiProperty } from "@nestjs/swagger";

export class UpdateInvestmentGoalResponseDto {
  @ApiProperty({
    description: 'Mensagem de meta de investimento atualizada',
    example: 'Meta de investimento atualizada com sucesso'
  })
  message: string;
}