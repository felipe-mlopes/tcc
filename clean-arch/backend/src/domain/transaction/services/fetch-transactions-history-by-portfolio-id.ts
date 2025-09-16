import { Either, left, right } from "@/shared/exceptions/either";
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
import { Transaction } from "../entities/transaction";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { TransactionRepository } from "../repositories/transaction-repository";
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository";
import { Injectable } from "@nestjs/common";

interface FetchTransactionsHistoryByPorfolioIdServiceRequest {
    investorId: string,
    page: number
}

type FetchTransactionsHistoryByPorfolioIdServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    transactions: Transaction[]
}>

@Injectable()
export class FetchTransactionsHistoryByPorfolioIdService {
    constructor(
        readonly investorRepository: InvestorRepository,
        readonly portfolioRepository: PortfolioRepository,
        readonly transactionRepository: TransactionRepository
    ) {}

    public async execute({
        investorId,
        page
    }: FetchTransactionsHistoryByPorfolioIdServiceRequest): Promise<FetchTransactionsHistoryByPorfolioIdServiceResponse> {
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

        const transactions = await this.transactionRepository.findManyByPortfolioId(
            portfolioId, 
            { page }
        )

        return right({
            transactions
        })
    }
}