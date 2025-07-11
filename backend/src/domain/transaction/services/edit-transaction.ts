import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Transaction, TransactionType } from "../entities/transaction";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { TransactionRepository } from "../repositories/transaction-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Quantity } from "@/core/value-objects/quantity";
import { Money } from "@/core/value-objects/money";

interface UpdateTransactionServiceRequest {
    investorId: string,
    transactionId: string,
    transactionType: TransactionType,
    quantity?: number,
    price?: number,
    fees?: number
}

type UpdateTransactionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactionEdited: Transaction
}>

type ValidateServiceResponse = Either<ResourceNotFoundError, {
    transaction: Transaction
}>

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
      
        if (!!transactionType) {
            transaction.updateTransactionType(transactionType)
        }

        if (!!quantity) {
            if (quantity < 0) quantity * -1

            const newQuantity = Quantity.create(quantity)
            if (newQuantity.isZero()) return left(new NotAllowedError())

            transaction.updateQuantity(newQuantity)
        }

        if (!!price) {
            if (price < 0) price * -1

            const newPrice = Money.create(price)
            if (newPrice.getAmount() == 0) return left(new NotAllowedError())

            transaction.updatePrice(newPrice)
        }

        if (!!fees) {
            if (fees < 0) fees * -1

            const newFees = Money.create(fees)
            if (newFees.getAmount() == 0) return left(new NotAllowedError())

            transaction.updateFees(newFees)
        }

        await this.transactionRepository.update(transaction)

        return right({
            transactionEdited: transaction
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
        if (!investor) return left(new ResourceNotFoundError())

        if (transactionType == undefined &&
            quantity == undefined &&
            price == undefined &&
            fees == undefined
        ) return left(new NotAllowedError())
    
        const transaction = await this.transactionRepository.findById(transactionId)
        if (!transaction) return left(new ResourceNotFoundError())

        return right({
            transaction
        })
    }
}