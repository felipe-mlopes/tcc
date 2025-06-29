import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";
import { InvestmentRepository } from "../repositories/investment-repository";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { Transaction, TransactionType } from "@/domain/transaction/entities/transaction";
import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Investment } from "../entities/investment";
import { UpdateInvestmentService, UpdateInvestmentServiceResponse } from "./update-investment";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type UpdateInvestmentAfterTransactionServiceResponse = Either<NotAllowedError, {
    updatedInvestment: Investment
}>

export class UpdateInvestmentAfterTransactionService {
    constructor(
        private investmentRepository: InvestmentRepository,
        private transactionRepository: TransactionRepository,
        private assetRepository: AssetRepository
    ) {}

    async execute(
        transaction: Transaction
    ): Promise<UpdateInvestmentAfterTransactionServiceResponse> {
        const portfolioId = String(transaction.portfolioId)
        const assetId = String(transaction.assetId)

        const asset = await this.assetRepository.findById(assetId)
        if (!asset) return left(new NotAllowedError())

        const currentInvestment = await this.investmentRepository.findByPortfolioAndAsset(
            portfolioId,
            assetId
        )     

        let calculationResult: UpdateInvestmentServiceResponse

        switch(transaction.transactionType) {
            case TransactionType.Buy:
                calculationResult = await UpdateInvestmentService.calculateBuyImpact(
                    currentInvestment,
                    transaction
                )
                break
            
            case TransactionType.Sell:
                if(!currentInvestment) return left(new NotAllowedError())
                calculationResult = await UpdateInvestmentService.calculateSellImpact(
                    currentInvestment,
                    transaction
                )
                break
            
            case TransactionType.Dividend:
                if(!currentInvestment) return left(new NotAllowedError())
                calculationResult = await UpdateInvestmentService.calculateDividendImpact(
                    currentInvestment,
                    transaction
                )
                break
            
            default:
                return left(new NotAllowedError())
        }

        if (calculationResult.isLeft()) return left(calculationResult.value)

        const { newQuantity, newAveragePrice, newTotalInvested, newCurrentValue, newProfitLoss } = calculationResult.value

        let updatedInvestment: Investment

        if (currentInvestment) {
            updatedInvestment = Investment.create({
                investmentId: currentInvestment.investmentId,
                assetId: currentInvestment.assetId,
                quantity: newQuantity,
                currentPrice: transaction.price,
                createdAt: currentInvestment.createdAt,
                updatedAt: new Date()
            }, currentInvestment.id)

            const allTransactions = await this.transactionRepository.findByPortfolioAndAsset(
                portfolioId,
                assetId
            )

            const sortedTransactions = allTransactions.sort(
                (a: Transaction, b: Transaction) => a.dateAt.getTime() - b.dateAt.getTime()
            )

            for (const t of sortedTransactions) {
                if (t.isBuyTransaction()) {

                    if (t.quantity.isZero()) throw new NotAllowedError()
                    if (!t.price || t.price.getAmount() <= 0) throw new NotAllowedError()
                    if (t.price.getCurrency() !== currentInvestment.currentPrice.getCurrency()) throw new NotAllowedError()
                    
                    updatedInvestment.addQuantity(t.quantity, t.price)
                }
            }

            await this.investmentRepository.update(updatedInvestment)
        } else {
            if (!transaction.isBuyTransaction()) return left(new NotAllowedError())

            updatedInvestment = Investment.create({
                investmentId: new UniqueEntityID(),
                assetId: transaction.assetId,
                quantity: newQuantity,
                currentPrice: transaction.price,
                initialQuantity: transaction.quantity,
                initialPrice: transaction.price
            })

            await this.investmentRepository.create(updatedInvestment)
        }

        const investimentId = String(currentInvestment.id)

        if (updatedInvestment.quantity.isZero()) {
            if (currentInvestment) {
                await this.investmentRepository.delete(investimentId)
            }
        }

        return right({
            updatedInvestment
        })
    }
}