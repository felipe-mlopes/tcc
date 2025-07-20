import { Either, left, right } from "@/core/either"
import { Transaction, TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { TransactionRepository } from "../repositories/transaction-repository"
import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { TransactionValidatorService } from "./transaction-validator"

interface RecordSellTransactionServiceRequest {
    investorId: string,
    assetName: string,
    transactionType: TransactionType,
    quantity: number,
    price: number,
    fees: number,
    dateAt: Date
}

type RecordSellTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    newSellTransaction: Transaction
}>

export class RecordSellTransactionService {
    constructor(
        private transactionRepository: TransactionRepository,
        private validator: TransactionValidatorService
    ) {}

    public async execute({
        investorId,
        assetName,
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
            assetName,
            quantity,
            price,
            fees
        })

        if (validationResult.isLeft()) {
            return left(validationResult.value)
        }

        const { asset, portfolio, quantityFormatted, priceFormatted, feesFormatted } = validationResult.value

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
            newSellTransaction
        })
    }
}