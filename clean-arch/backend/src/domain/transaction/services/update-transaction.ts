import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Transaction, TransactionType } from "../entities/transaction";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { TransactionRepository } from "../repositories/transaction-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Quantity } from "@/core/value-objects/quantity";
import { Money } from "@/core/value-objects/money";
import { Injectable } from "@nestjs/common";

interface UpdateTransactionServiceRequest {
    investorId: string,
    transactionId: string,
    transactionType: TransactionType,
    quantity?: number,
    price?: number,
    fees?: number
}

type UpdateTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    message: string
}>

type ValidateServiceResponse = Either<ResourceNotFoundError, {
    transaction: Transaction
}>

@Injectable()
export class UpdateTransactionService {
    constructor(
        private investorRepository: InvestorRepository,
        private transactionRepository: TransactionRepository
    ) {}

    public async execute({
        investorId,
        transactionId,
        transactionType,
        quantity,
        price,
        fees
    }: UpdateTransactionServiceRequest): Promise<UpdateTransactionServiceResponse> {
        const validate = await this.validateRequests({
            investorId,
            transactionId,
            transactionType,
            quantity,
            price,
            fees
        })
        if (validate.isLeft()) return left(validate.value)

        const { transaction } = validate.value
      
        if (transactionType && transactionType.trim().length > 0) {
            transaction.updateTransactionType(transactionType)
        }

        if (quantity !== undefined) {
            quantity = Math.abs(quantity)

            const newQuantity = Quantity.create(quantity)
            if (newQuantity.isZero()) return left(new NotAllowedError(
                'Quantity must be greater than zero.'
            ))

            transaction.updateQuantity(newQuantity)
            transaction.updateTotalAmount()
        }

        if (price !== undefined) {
            price = Math.abs(price)

            const newPrice = Money.create(price)
            if (newPrice.getAmount() == 0) return left(new NotAllowedError(
                'Price must be greater than zero.'
            ))

            transaction.updatePrice(newPrice)
            transaction.updateTotalAmount()
        }

        if (fees !== undefined) {
            fees = Math.abs(fees)

            const newFees = Money.create(fees)
            if (newFees.getAmount() == 0) return left(new NotAllowedError(
                'Fees must be greater than zero.'
            ))

            transaction.updateFees(newFees)
            transaction.updateTotalAmount()
        }

        await this.transactionRepository.update(transaction)

        return right({
            message: 'Transação atualizada com sucesso'
        })
    }

    private async validateRequests({    
        investorId,
        transactionId,
        transactionType,
        quantity,
        price,
        fees
    }: UpdateTransactionServiceRequest): Promise<ValidateServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        if (transactionType == undefined &&
            quantity == undefined &&
            price == undefined &&
            fees == undefined
        ) return left(new NotAllowedError(
            'At least one transaction field must be provided.'
        ))
    
        const transaction = await this.transactionRepository.findById(transactionId)
        if (!transaction) return left(new ResourceNotFoundError(
            'Transaction not found.'
        ))

        return right({
            transaction
        })
    }
}