import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@prisma/client";

export class FetchAllTransactionsHistoryResponseDto {
    @ApiProperty({
        description: 'ID único da transação',
        example: 'uuid-transaction-123-456'
    })
    id: string

    @ApiProperty({
        description: 'ID do ativo investido',
        example: 'uuid-asset-999-888'
    })
    assetId: string

    @ApiProperty({
        description: 'ID do portfólio onde está o investimento',
        example: 'uuid-portfolio-789'
    })
    portfolioId: string

    @ApiProperty({
        description: 'Quantidade da transação',
        example: 150
    })
    quantity: number

    @ApiProperty({
        description: 'Preço da transação',
        example: 32.50
    })
    price: number

    @ApiProperty({
        description: 'Tipo da transação',
        example: 'Buy'
    })
    transactionType: TransactionType

    @ApiProperty({
        description: 'Data da transação',
        example: '2024-06-10T14:30:00.000Z'
    })
    dateAt: Date
}

export class FetchTransactionsHistoryWrapperDto {
    @ApiProperty({
        description: 'Lista de transações',
        type: [FetchAllTransactionsHistoryResponseDto]
    })
    transactions: FetchAllTransactionsHistoryResponseDto[]
}