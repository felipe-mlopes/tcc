import { Either, left, right } from "@/shared/exceptions/either"
import { Transaction, TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error"
import { TransactionRepository } from "../repositories/transaction-repository"
import { TransactionValidatorService } from "./transaction-validator"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"
import { Injectable } from "@nestjs/common"

interface RecordDividendTransactionServiceRequest {
    investorId: string,
    assetId: string,
    transactionType: TransactionType,
    price: number,
    income: number,
    dateAt: Date
}

type RecordDividendTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    id: string
    message: string
}>

@Injectable()
export class RecordDividendTransactionService {
    constructor(
        readonly transactionRepository: TransactionRepository,
        readonly validator: TransactionValidatorService
    ) {}

    public async execute({
        investorId,
        assetId,
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
            assetId,
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
            id: newDividendTransaction.id.toValue().toString(),
            message: 'A transação de dividendo foi registrada com sucesso'
        })
    }
}