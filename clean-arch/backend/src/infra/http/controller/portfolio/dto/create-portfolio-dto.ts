import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const createPortfolioBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres'),
  
  description: z
    .string()
    .optional()
});

export class CreatePortfolioDto extends createZodDto(createPortfolioBodySchema) {
  @ApiProperty({
    description: 'Nome do portfólio',
    example: 'Portfólio Conservador',
    minLength: 3
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição opcional do portfólio',
    example: 'Carteira focada em investimentos de baixo risco para reserva de emergência'
  })
  description?: string;
}