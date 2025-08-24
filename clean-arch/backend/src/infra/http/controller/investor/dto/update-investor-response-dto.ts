import { ApiProperty } from "@nestjs/swagger";

export class UpdateInvestorResponseDto {
@ApiProperty({
        description: 'ID único do investidor criado',
        example: 'uuid-123-456-789'
    })
    id: string;

    @ApiProperty({
        description: 'Email do investidor',
        example: 'joao.silva@email.com'
    })
    email: string;

    @ApiProperty({
        description: 'Nome do investidor',
        example: 'João Silva Santos'
    })
    name: string;

    @ApiProperty({
        description: 'CPF formatado do investidor',
        example: '123.456.789-01'
    })
    cpf: string;

    @ApiProperty({
        description: 'Data de nascimento',
        example: '1990-05-15'
    })
    dateOfBirth: Date;

    @ApiProperty({
        description: 'Status da criação',
        example: 'created'
    })
    status: string;

    @ApiProperty({
        description: 'Data de criação do registro',
        example: '2024-01-01T10:30:00Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Data da última atualização',
        example: '2024-01-15T15:30:00Z'
    })
    updatedAt: Date
}