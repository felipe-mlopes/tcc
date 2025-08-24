import { Either, left, right } from "@/core/either"
import { Transaction, TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { TransactionRepository } from "../repositories/transaction-repository"
import { TransactionValidatorService } from "./transaction-validator"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"
import { Injectable } from "@nestjs/common"

interface RecordDividendTransactionServiceRequest {
    investorId: string,
    assetName: string,
    transactionType: TransactionType,
    price: number,
    income: number,
    dateAt: Date
}

type RecordDividendTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    newDividendTransaction: Transaction
}>

@Injectable()
export class RecordDividendTransactionService {
    constructor(
        private transactionRepository: TransactionRepository,
        private validator: TransactionValidatorService
    ) {}

    public async execute({
        investorId,
        assetName,
        transactionType,
        price,
        income,
        dateAt
    }: RecordDividendTransactionServiceRequest): Promise<RecordDividendTransactionServiceResponse> {
        if(transactionType != TransactionType.Dividend) return left(new NotAllowedError(
            'Only dividend transactions are allowed for this operation.'
        ))

        const validationResult = await this.validator.validate({
            investorId,
            assetName,
            price,
            income
        })

        if (validationResult.isLeft()) {
            return left(validationResult.value)
        }

        const { asset, portfolio, priceFormatted, incomeFormatted } = validationResult.value

        if (incomeFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Income must be greater than zero.'
        ))

        const newDividendTransaction = Transaction.create({
            assetId: asset.id,
            portfolioId: portfolio.id,
            transactionType,
            quantity: Quantity.zero(),
            price: priceFormatted,
            income: incomeFormatted,
            fees: Money.zero(),
            dateAt
        })

        await this.transactionRepository.create(newDividendTransaction)

        return right({
            newDividendTransaction
        })
    }
}