import { Either, left, right } from "@/shared/exceptions/either"
import { Transaction, TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error"
import { TransactionRepository } from "../repositories/transaction-repository"
import { TransactionValidatorService } from "./transaction-validator"
import { Injectable } from "@nestjs/common"

interface RecordSellTransactionServiceRequest {
    investorId: string,
    assetId: string,
    transactionType: TransactionType,
    quantity: number,
    price: number,
    fees: number,
    dateAt: Date
}

type RecordSellTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    id: string
    message: string
}>

@Injectable()
export class RecordSellTransactionService {
    constructor(
        readonly transactionRepository: TransactionRepository,
        readonly validator: TransactionValidatorService
    ) {}

    public async execute({
        investorId,
        assetId,
        transactionType,
        quantity,
        price,
        fees,
        dateAt
    }: RecordSellTransactionServiceRequest): Promise<RecordSellTransactionServiceResponse> {
        if(transactionType != TransactionType.Sell) return left(new NotAllowedError(
            'Only sell transactions are allowed for this operation.'
        ))

        const validationResult = await this.validator.validate({
            investorId,
            assetId,
            quantity,
            price,
            fees
        })

        if (validationResult.isLeft()) {
            return left(validationResult.value)
        }

        const { asset, portfolio, quantityFormatted, priceFormatted, feesFormatted } = validationResult.value

        if (quantityFormatted.isZero()) return left(new NotAllowedError(
            'Quantity must be greater than zero.'
        ))

        if (feesFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Fees must be greater than zero.'
        ))

        const newSellTransaction = Transaction.create({
            assetId: asset.id,
            portfolioId: portfolio.id,
            transactionType,
            quantity: quantityFormatted,
            price: priceFormatted,
            fees: feesFormatted,
            dateAt
        })

        await this.transactionRepository.create(newSellTransaction)

        return right({
            id: newSellTransaction.id.toValue().toString(),
            message: 'A transação de venda foi registrada com sucesso'
        })
    }
}