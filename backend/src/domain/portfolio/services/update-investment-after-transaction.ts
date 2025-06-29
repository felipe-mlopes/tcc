import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";
import { InvestmentRepository } from "../repositories/investment-repository";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { Transaction, TransactionType } from "@/domain/transaction/entities/transaction";
import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Investment } from "../entities/investment";
import { UpdateInvestmentService, UpdateInvestmentServiceResponse } from "./update-investment";
import { Asset } from "@/domain/asset/entities/asset";

type UpdateInvestmentAfterTransactionServiceResponse = Either<NotAllowedError, {
    investmet: Investment
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

        
        
    }
}