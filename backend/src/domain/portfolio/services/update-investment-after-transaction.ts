import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";
import { InvestmentRepository } from "../repositories/investment-repository";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { Transaction, TransactionType } from "@/domain/transaction/entities/transaction";
import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Investment } from "../entities/investment";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface UpdateInvestmentAfterTransactionServiceRequest {
    investorId: string,
    transactionId: string
}

interface CalculateImpactRequest {
    currentInvestment: Investment,
    transaction: Transaction
}

type UpdateInvestmentAfterTransactionServiceResponse = Either<NotAllowedError, {
    updatedInvestment: Investment
}>

type ValidateServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    currentInvestment: Investment | null,
    transaction: Transaction
}>

type CalculateImpactResponse = Either<NotAllowedError, {
    updatedInvestment: Investment
}>

export class UpdateInvestmentAfterTransactionService {
    constructor(
        private investorRepository: InvestorRepository,
        private investmentRepository: InvestmentRepository,
        private transactionRepository: TransactionRepository,
        private assetRepository: AssetRepository
    ) {}

    public async execute({
        investorId,
        transactionId
    }: UpdateInvestmentAfterTransactionServiceRequest): Promise<UpdateInvestmentAfterTransactionServiceResponse> {
        const investimentValidate = await this.validateRequests({investorId, transactionId})
        if (investimentValidate.isLeft()) return left(investimentValidate.value)

        const { currentInvestment, transaction } = investimentValidate.value

        let calculationResult: CalculateImpactResponse

        if (currentInvestment !== null) {
            switch(transaction.transactionType) {
                case TransactionType.Buy:
                    calculationResult = await this.calculateBuyImpact({ currentInvestment, transaction })
                    break
                
                case TransactionType.Sell:
                    calculationResult = await this.calculateSellImpact({ currentInvestment, transaction })
                    break
                
                case TransactionType.Dividend:
                    calculationResult = await this.calculateDividendImpact({ currentInvestment, transaction })
                    break
                
                default:
                    return left(new NotAllowedError('Unsupported transaction type.'))
            }
        } else {
            calculationResult = await this.createNewInvestment(transaction)
        }

        if (calculationResult.isLeft()) return left(calculationResult.value)

        return right({
            updatedInvestment: calculationResult.value.updatedInvestment
        })
    }

    private async validateRequests({
        investorId,
        transactionId        
    }: UpdateInvestmentAfterTransactionServiceRequest): Promise<ValidateServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))
        
        const transaction = await this.transactionRepository.findById(transactionId)
        if (!transaction) return left(new ResourceNotFoundError(
            'Transaction not found.'
        ))
        
        const portfolioId = transaction.portfolioId.toValue().toString()
        const assetId = transaction.assetId.toValue().toString()

        const asset = await this.assetRepository.findById(assetId)
        if (!asset) return left(new ResourceNotFoundError(
            'Asset not found.'
        ))

        const currentInvestment = await this.investmentRepository.findByPortfolioIdAndAssetId(
            portfolioId,
            assetId
        )     
        
        return right({
            currentInvestment,
            transaction
        })
    }

    private async calculateBuyImpact({
        currentInvestment,
        transaction
    }: CalculateImpactRequest): Promise<CalculateImpactResponse> {
        currentInvestment.addQuantity({
            transactionId: transaction.id,
            quantity: transaction.quantity,
            price: transaction.price,
            date: transaction.dateAt
        })
        currentInvestment.updateCurrentPrice(transaction.price)

        await this.investmentRepository.update(currentInvestment)

        return right({
            updatedInvestment: currentInvestment
        })
    }

    private async calculateSellImpact({
        currentInvestment,
        transaction
    }: CalculateImpactRequest): Promise<CalculateImpactResponse> {
        currentInvestment.reduceQuantity({
            transactionId: transaction.id,
            quantity: transaction.quantity,
            price: transaction.price,
            date: transaction.dateAt
        })
        currentInvestment.updateCurrentPrice(transaction.price)

        await this.investmentRepository.update(currentInvestment)

        return right({
            updatedInvestment: currentInvestment
        })
    }

    private async calculateDividendImpact({
        currentInvestment,
        transaction
    }: CalculateImpactRequest): Promise<CalculateImpactResponse> {        
        currentInvestment.includeYield({
            yieldId: new UniqueEntityID(),
            incomeValue: transaction.price,
            date: transaction.dateAt
        })
        
        currentInvestment.updateCurrentPrice(transaction.price)
        
        await this.investmentRepository.update(currentInvestment)

        return right({
            updatedInvestment: currentInvestment
        })
    }

    private async createNewInvestment(transaction: Transaction): Promise<CalculateImpactResponse> {
        if (!transaction.isBuyTransaction()) return left(new NotAllowedError(
            'Only buy transactions are allowed for this operation.'
        ))

        const newInvestment = Investment.create({
            assetId: transaction.assetId,
            portfolioId: transaction.portfolioId,
            quantity: transaction.quantity,
            currentPrice: transaction.price
        })

        newInvestment.includeTransaction({
            transactionId: transaction.id,
            quantity: transaction.quantity,
            price: transaction.price,
            date: transaction.dateAt
        })

        await this.investmentRepository.create(newInvestment)

        return right({
            updatedInvestment: newInvestment
        })
    }
}