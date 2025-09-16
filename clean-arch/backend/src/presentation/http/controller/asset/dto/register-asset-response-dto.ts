import { ApiProperty } from "@nestjs/swagger";

export class RegisterAssetResponseDto {
    @ApiProperty({
        description: 'Messagem de criação do ativo',
        example: 'O cadastro do ativo foi realizado com sucesso'
    })
    message: string;
}