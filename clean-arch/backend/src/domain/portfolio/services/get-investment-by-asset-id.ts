import { Either, left, right } from "@/shared/exceptions/either"
import { Investment } from "../entities/investment"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository"
import { PortfolioRepository } from "../repositories/portfolio-repository"
import { InvestmentRepository } from "../repositories/investment-repository"
import { AssetRepository } from "@/domain/asset/repositories/asset-repository"
import { Portfolio } from "../entities/portfolio"
import { Injectable } from "@nestjs/common"

interface GetInvestmentByAssetIdServiceRequest {
    investorId: string
    assetId: string
}

type GetInvestmentByAssetIdServiceResponse = Either<ResourceNotFoundError, {
    investment: Investment | null
}>

type ValidatorGetInvestmentServiceResponse = Either<ResourceNotFoundError, {
    portfolioVerified: Portfolio
}>

@Injectable()
export class GetInvestmentByAssetIdService {
    constructor(
        readonly investorRepository: InvestorRepository,
        readonly assetRepository: AssetRepository,
        readonly portfolioRepository: PortfolioRepository,
        readonly investmentRepository: InvestmentRepository
    ) {}

    public async execute({
        investorId,
        assetId,
    }: GetInvestmentByAssetIdServiceRequest): Promise<GetInvestmentByAssetIdServiceResponse> {
        const validationResult = await this.validateRequests({
            assetId,
            investorId
        })

        if (validationResult.isLeft()) return left(validationResult.value)

        const { portfolioVerified } = validationResult.value

        const portfolioId = portfolioVerified.id.toValue().toString()

        const investment = await this.investmentRepository.findByPortfolioIdAndAssetId(
            portfolioId,
            assetId
        )

        return right({
            investment
        })
    }

    private async validateRequests({
        investorId,
        assetId
    }: GetInvestmentByAssetIdServiceRequest): Promise<ValidatorGetInvestmentServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        const assetVerified = await this.assetRepository.findById(assetId)
        if (!assetVerified) return left(new ResourceNotFoundError(
            'Asset not found.'
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