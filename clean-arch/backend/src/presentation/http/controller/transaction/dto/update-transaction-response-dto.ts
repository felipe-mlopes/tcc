import { ApiProperty } from "@nestjs/swagger";

export class UpdateTransactionResponseDto {
  @ApiProperty({
    description: 'Mensagem de transação atualizada com sucesso',
    example: 'Transação atualizada com sucesso'
  })
  message: string;
}