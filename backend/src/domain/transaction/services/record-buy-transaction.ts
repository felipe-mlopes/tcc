import { TransactionRepository } from "../repositories/transaction-repository"
import { Either, left, right } from "@/core/either"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Transaction, TransactionType } from "../entities/transaction"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { TransactionValidatorService } from "./transaction-validator"

interface RecordBuyTransactionServiceRequest {
    investorId: string,
    assetName: string,
    transactionType: TransactionType,
    quantity: number,
    price: number,
    fees: number,
    dateAt: Date
}

type RecordBuyTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    newBuyTransaction: Transaction
}>

export class RecordBuyTransactionService {
    constructor(
        private transactionRepository: TransactionRepository,
        private validator: TransactionValidatorService
    ) {}

    async execute({
        investorId,
        assetName,
        transactionType,
        quantity,
        price,
        fees,
        dateAt
    }: RecordBuyTransactionServiceRequest): Promise<RecordBuyTransactionServiceResponse> {
        if(transactionType != TransactionType.Buy) return left(new NotAllowedError())

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

        const newBuyTransaction = Transaction.create({
            transactionId: new UniqueEntityID(),
            assetId: asset.assedId,
            portfolioId: portfolio.portfolioId,
            transactionType,
            quantity: quantityFormatted,
            price: priceFormatted,
            fees: feesFormatted,
            dateAt
        })

        await this.transactionRepository.create(newBuyTransaction)

        return right({
            newBuyTransaction
        })
    }
}