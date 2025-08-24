import { ApiProperty } from "@nestjs/swagger";

export class RecordSellTransactionResponseDto {
    @ApiProperty({
        description: 'Messagem de transação de venda concluída com sucesso',
        example: 'A transação de venda foi registrada com sucesso'
    })
    message: string
}