import { ApiProperty } from "@nestjs/swagger";

export class RegisterAssetResponseDto {
    @ApiProperty({
        description: 'ID único do ativo criado',
        example: 'uuid-123-456-789'
    })
    id: string;

    @ApiProperty({
        description: 'Símbolo do ativo',
        example: 'AAPL'
    })
    symbol: string;

    @ApiProperty({
        description: 'Nome do ativo',
        example: 'Apple Inc.'
    })
    name: string;

    @ApiProperty({
        description: 'Status da criação',
        example: 'created'
    })
    status: string;

    @ApiProperty({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00Z'
    })
    createdAt: Date;
    }