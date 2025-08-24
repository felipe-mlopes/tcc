import { TransactionRepository } from "../repositories/transaction-repository"
import { Either, left, right } from "@/core/either"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Transaction, TransactionType } from "../entities/transaction"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { TransactionValidatorService } from "./transaction-validator"
import { Injectable } from "@nestjs/common"

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
    message: string
}>

@Injectable()
export class RecordBuyTransactionService {
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
    }: RecordBuyTransactionServiceRequest): Promise<RecordBuyTransactionServiceResponse> {
        if(transactionType != TransactionType.Buy) return left(new NotAllowedError(
            'Only buy transactions are allowed for this operation.'
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
        
        if (quantityFormatted.isZero()) return left(new NotAllowedError(
            'Quantity must be greater than zero.'
        ))

        if (feesFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Fees must be greater than zero.'
        ))
        
        const newBuyTransaction = Transaction.create({
            assetId: asset.id,
            portfolioId: portfolio.id,
            transactionType,
            quantity: quantityFormatted,
            price: priceFormatted,
            fees: feesFormatted,
            dateAt
        })

        await this.transactionRepository.create(newBuyTransaction)

        return right({
            message: 'A transação de compra foi registrada com sucesso'
        })
    }
}