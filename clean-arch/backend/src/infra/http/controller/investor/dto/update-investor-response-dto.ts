import { ApiProperty } from "@nestjs/swagger";

export class UpdateInvestorResponseDto {
    @ApiProperty({
        description: 'Mensagem de atualização do cadastro do investidor',
        example: 'O cadastro do investidor foi atualizado com sucesso'
    })
    message: string;
}