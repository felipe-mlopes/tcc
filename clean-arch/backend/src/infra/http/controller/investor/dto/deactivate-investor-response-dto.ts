import { ApiProperty } from "@nestjs/swagger";

export class DeactivateInvestorResponseDto {
  @ApiProperty({
    description: 'ID do investidor desativado',
    example: 'uuid-123-456-789'
  })
  id: string;

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Investidor desativado com sucesso'
  })
  message: string;

  @ApiProperty({
    description: 'Status do investidor após desativação',
    example: 'inactive'
  })
  status: string;

  @ApiProperty({
    description: 'Data da desativação',
    example: '2024-01-15T16:30:00Z'
  })
  deactivatedAt: Date;
}