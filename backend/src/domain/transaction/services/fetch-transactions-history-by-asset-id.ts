import { Either, left, right } from "@/core/either"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Transaction } from "../entities/transaction"
import { TransactionRepository } from "../repositories/transaction-repository"
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository"
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository"

interface FetchTransactionsHistoryByAssetIdServiceRequest {
    investorId: string,
    assetId: string,
    page: number
}

type FetchTransactionsHistoryByAssetIdServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactions: Transaction[]
}>

export class FetchTransactionsHistoryByAssetIdService {
    constructor(
        private investorRepository: InvestorRepository,
        private portfolioRepository: PortfolioRepository,
        private transactionRepository: TransactionRepository
    ) {}

    public async execute({
        investorId,
        assetId,
        page
    }: FetchTransactionsHistoryByAssetIdServiceRequest): Promise<FetchTransactionsHistoryByAssetIdServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found'
        ))

        const id = investor.id.toValue().toString()

        const portfolio = await this.portfolioRepository.findByInvestorId(id)
        if (!portfolio) return left(new ResourceNotFoundError(
            'Portfolio not found'
        ))

        const portfolioId = portfolio.id.toValue().toString()
        
        const transactions = await this.transactionRepository.findByManyPortfolioAndAsset(
            portfolioId,
            assetId,
            { page }
        )

        return right({
            transactions
        })
    }
}