import { Either, left, right } from "@/core/either"
import { Transaction, TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { TransactionRepository } from "../repositories/transaction-repository"
import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { TransactionValidatorService } from "./transaction-validator"

interface RecordDividendTransactionServiceRequest {
    investorId: string,
    assetName: string,
    transactionType: TransactionType,
    quantity: number,
    price: number,
    fees: number,
    dateAt: Date
}

type RecordDividendTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    newDividendTransaction: Transaction
}>

export class RecordDividendTransactionService {
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
    }: RecordDividendTransactionServiceRequest): Promise<RecordDividendTransactionServiceResponse> {
        if(transactionType != TransactionType.Dividend) return left(new NotAllowedError())

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

        const newDividendTransaction = Transaction.create({
            assetId: asset.id,
            portfolioId: portfolio.portfolioId,
            transactionType,
            quantity: quantityFormatted,
            price: priceFormatted,
            fees: feesFormatted,
            dateAt
        })

        await this.transactionRepository.create(newDividendTransaction)

        return right({
            newDividendTransaction
        })
    }
}