import { AssetType } from "@/domain/asset/entities/asset";
import { ApiProperty } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const registerAssetBodySchema = z.object({
  symbol: z.string()
    .min(3, 'Símbolo deve ter no mínimo 3 caracteres')
    .max(5, 'Símbolo deve ter no máximo 5 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Símbolo deve conter apenas letras maiúsculas e números'),
  
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  assetType: z.enum(Object.values(AssetType), {
    message: `Tipo de ativo deve ser um dos: ${Object.values(AssetType).join(", ")}`
  }),
  
  sector: z.string()
    .min(2, 'Setor deve ter no mínimo 2 caracteres')
    .max(50, 'Setor deve ter no máximo 50 caracteres'),
  
  exchange: z.string()
    .min(2, 'Exchange deve ter no mínimo 2 caracteres')
    .max(20, 'Exchange deve ter no máximo 20 caracteres'),
  
  currency: z.string()
    .min(3, 'Moeda deve ter exatamente 3 caracteres')
    .max(3, 'Moeda deve ter exatamente 3 caracteres')
    .regex(/^[A-Z]{3}$/, 'Moeda deve ser um código de 3 letras maiúsculas (ex: USD, BRL)')
});

export class RegisterAssetDto extends createZodDto(registerAssetBodySchema) {
    @ApiProperty({
        description: 'Símbolo do ativo (ticker)',
        example: 'AAPL',
        minLength: 3,
        maxLength: 5,
        pattern: '^[A-Z0-9]+$'
    })
    symbol: string;

    @ApiProperty({
        description: 'Nome completo do ativo',
        example: 'Apple Inc.',
        minLength: 3,
        maxLength: 100
    })
    name: string;

    @ApiProperty({
        description: 'Tipo do ativo',
        enum: AssetType,
        example: AssetType.Stock,
        enumName: 'AssetType'
    })
    assetType: AssetType;

    @ApiProperty({
        description: 'Setor econômico do ativo',
        example: 'Technology',
        minLength: 2,
        maxLength: 50
    })
    sector: string;

    @ApiProperty({
        description: 'Bolsa onde o ativo é negociado',
        example: 'NASDAQ',
        minLength: 2,
        maxLength: 20
    })
    exchange: string;

    @ApiProperty({
        description: 'Moeda base do ativo',
        example: 'USD',
        minLength: 3,
        maxLength: 3,
        pattern: '^[A-Z]{3}$'
    })
    currency: string;
}