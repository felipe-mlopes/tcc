import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { InvestmentRepository } from "../repositories/investment-repository";
import { PortfolioRepository } from "../repositories/portfolio-repository";
import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { Investment } from "../entities/investment";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Quantity } from "@/core/value-objects/quantity";
import { Money } from "@/core/value-objects/money";
import { Investor } from "@/domain/investor/entities/investor";
import { Asset } from "@/domain/asset/entities/asset";
import { Portfolio } from "../entities/portfolio";


interface AddInvestmentToPortfolioServiceRequest {
    investorId: string,
    assetId: string,
    quantity: number,
    currentPrice: number
}

type AddInvestmentToPortfolioServiceResponse = Either<ResourceNotFoundError, {}>

type ValidateServiceResponse = Either<ResourceNotFoundError, {
    investorVerified: Investor,
    assetVerified: Asset,
    portfolioVerified: Portfolio,
    quantityFormatted: Quantity,
    currentPriceFormatted: Money
}>

export class AddInvestmentToPortfolioService {
    constructor(
        private portfolioRepository: PortfolioRepository,
        private assetRepository: AssetRepository,
        private investmentRepository: InvestmentRepository,
        private investorRepository: InvestorRepository
    ) {}

    public async execute({
        investorId,
        assetId,
        currentPrice,
        quantity
    }: AddInvestmentToPortfolioServiceRequest): Promise<AddInvestmentToPortfolioServiceResponse> {
        const validate = await this.validateRequests({
            investorId,
            assetId,
            currentPrice,
            quantity
        })
        if (validate.isLeft()) return left(validate.value)

        const { assetVerified, portfolioVerified, quantityFormatted, currentPriceFormatted } = validate.value

        const investmentId = new UniqueEntityID()
        const portfolioId = portfolioVerified.portfolioId.toValue().toString()

        const newInvestment = Investment.create({
            investmentId,
            portfolioId: new UniqueEntityID(portfolioId),
            assetId: assetVerified.assedId,
            quantity: quantityFormatted,
            currentPrice: currentPriceFormatted
        })
        await this.investmentRepository.create(newInvestment)
        
        // Adiciona o investmentId no Allocations do Portfolio
        portfolioVerified.updateAllocation(investmentId.toValue().toString())
        portfolioVerified.increaseTotalValue(quantity, currentPrice)
        await this.portfolioRepository.update(portfolioVerified)

        return right({
            newInvestment
        })
    }

    private async validateRequests({
        investorId,
        assetId,
        quantity,
        currentPrice
    }: AddInvestmentToPortfolioServiceRequest): Promise<ValidateServiceResponse> {
        const investorVerified = await this.investorRepository.findById(investorId)      
        if (!investorVerified) return left(new ResourceNotFoundError())

        const assetVerified = await this.assetRepository.findById(assetId)
        if (!assetVerified) return left(new ResourceNotFoundError())

        const portfolioVerified = await this.portfolioRepository.findByInvestorId(investorId)
        if (!portfolioVerified) return left(new ResourceNotFoundError())

        const quantityFormatted = Quantity.create(quantity)
        const currentPriceFormatted = Money.create(currentPrice)

        return right({
            investorVerified,
            assetVerified,
            portfolioVerified,
            quantityFormatted,
            currentPriceFormatted
        })
    }

}