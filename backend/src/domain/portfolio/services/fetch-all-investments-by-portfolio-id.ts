import { Either, left, right } from "@/core/either"
import { Investment } from "../entities/investment"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository"
import { PortfolioRepository } from "../repositories/portfolio-repository"
import { InvestmentRepository } from "../repositories/investment-repository"
import { Portfolio } from "../entities/portfolio"

interface FetchAllInvestmentsByPortfolioIdServiceRequest {
    investorId: string
    page: number
}

type FetchAllInvestmentsByPortfolioIdServiceResponse = Either<ResourceNotFoundError, {
    investment: Investment[]
}>

type ValidatorFetchAllInvestmentsServiceResponse = Either<ResourceNotFoundError, {
    portfolioVerified: Portfolio
}>

export class FetchAllInvestmentsByPortfolioIdService {
    constructor(
        private investorRepository: InvestorRepository,
        private portfolioRepository: PortfolioRepository,
        private investmentRepository: InvestmentRepository
    ) {}

    public async execute({
        investorId,
        page
    }: FetchAllInvestmentsByPortfolioIdServiceRequest): Promise<FetchAllInvestmentsByPortfolioIdServiceResponse> {
        const validationResult = await this.validateRequests({
            investorId,
            page
        })

        if (validationResult.isLeft()) return left(validationResult.value)

        const { portfolioVerified } = validationResult.value

        const portfolioId = portfolioVerified.id.toValue().toString()

        const investment = await this.investmentRepository.findManyByPortfolio(
            portfolioId,
            {
                page
            }
        )

        return right({
            investment
        })
    }

    private async validateRequests({
        investorId
    }: FetchAllInvestmentsByPortfolioIdServiceRequest): Promise<ValidatorFetchAllInvestmentsServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        const id = investor.id.toValue().toString()

        const portfolioVerified = await this.portfolioRepository.findByInvestorId(id)
        if (!portfolioVerified) return left(new ResourceNotFoundError(
            'Portfolio not found.'
        ))

        return right({
            portfolioVerified
        })
    }
}