import { ApiProperty } from "@nestjs/swagger";

export class RecordDividendTransactionResponseDto {
    @ApiProperty({
        description: 'Messagem de transação de dividendo concluída com sucesso',
        example: 'A transação de dividendo foi registrada com sucesso'
    })
    message: string
}