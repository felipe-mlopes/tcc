import { Either, left, right } from "@/core/either";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Transaction } from "../entities/transaction";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { TransactionRepository } from "../repositories/transaction-repository";
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository";

interface FetchTransactionsHistoryByPorfolioIdServiceRequest {
    investorId: string,
    page: number
}

type FetchTransactionsHistoryByPorfolioIdServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactions: Transaction[]
}>

export class FetchTransactionsHistoryByPorfolioIdService {
    constructor(
        private investorRepository: InvestorRepository,
        private portfolioRepository: PortfolioRepository,
        private transactionRepository: TransactionRepository
    ) {}

    public async execute({
        investorId,
        page
    }: FetchTransactionsHistoryByPorfolioIdServiceRequest): Promise<FetchTransactionsHistoryByPorfolioIdServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        const id = String(investor.id)

        const portfolio = await this.portfolioRepository.findByInvestorId(id)
        if (!portfolio) return left(new ResourceNotFoundError())

        const portfolioId = String(portfolio.id)

        const transactions = await this.transactionRepository.findManyByPortfolioId(portfolioId, {
            page
        })

        return right({
            transactions
        })
    }
}