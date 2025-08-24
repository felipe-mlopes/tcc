import { ApiProperty } from "@nestjs/swagger";

export class RecordBuyTransactionResponseDto {
    @ApiProperty({
        description: 'Messagem de transação de compra concluída com sucesso',
        example: 'A transação de compra foi registrada com sucesso'
    })
    message: string
}