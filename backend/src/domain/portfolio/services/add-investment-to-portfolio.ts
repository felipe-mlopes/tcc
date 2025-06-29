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


interface AddInvestmentToPortfolioServiceRequest {
    investorId: string,
    assetId: string,
    quantity: number,
    currentPrice: number
}

type AddInvestmentToPortfolioServiceResponse = Either<ResourceNotFoundError, {}>

export class AddInvestmentToPortfolioService {
    constructor(
        private portfolioRepository: PortfolioRepository,
        private assetRepository: AssetRepository,
        private investmentRepository: InvestmentRepository,
        private investorRepository: InvestorRepository
    ) {}

    async execute({
        investorId,
        assetId,
        currentPrice,
        quantity
    }: AddInvestmentToPortfolioServiceRequest): Promise<AddInvestmentToPortfolioServiceResponse> {
        const investVerified = await this.investorRepository.findById(investorId)      
        if (!investVerified) return left(new ResourceNotFoundError())

        const assetVerified = await this.assetRepository.findById(assetId)
        if (!assetVerified) return left(new ResourceNotFoundError())

        const portfolioVerified = await this.portfolioRepository.findByUserId(investorId)
        if (!portfolioVerified) return left(new ResourceNotFoundError())

        const investmentId = new UniqueEntityID()

        const newInvestment = Investment.create({
            investmentId,
            assetId: new UniqueEntityID(assetId),
            quantity: Quantity.create(quantity),
            currentPrice: Money.create(currentPrice)
        })
        await this.investmentRepository.create(newInvestment)
        
        // Adiciona o investmentId no Allocations do Portfolio
        portfolioVerified.updateAllocation(String(investmentId))
        portfolioVerified.increaseTotalValue(quantity, currentPrice)
        await this.portfolioRepository.update(portfolioVerified)

        return right({
            newInvestment
        })
    }

}