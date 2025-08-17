import { Either, left, right } from "@/core/either"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "@/domain/portfolio/entities/portfolio"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository"
import { AssetRepository } from "@/domain/asset/repositories/asset-repository"
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository"
import { Quantity } from "@/core/value-objects/quantity"
import { Money } from "@/core/value-objects/money"

interface TransactionValidatorServiceRequest {
    investorId: string
    assetName: string
    quantity?: number
    price: number
    fees?: number
    income?: number
}

type TransactionValidatorServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    investor: Investor
    asset: Asset
    portfolio: Portfolio
    quantityFormatted: Quantity
    priceFormatted: Money
    feesFormatted: Money
    incomeFormatted: Money
}>

export class TransactionValidatorService {
    constructor(
        private investorRepository: InvestorRepository,
        private assetRepository: AssetRepository,
        private portfolioRepository: PortfolioRepository
    ) {}

    async validate({
        investorId,
        assetName,
        quantity,
        price,
        fees,
        income
    }: TransactionValidatorServiceRequest): Promise<TransactionValidatorServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        const asset = await this.assetRepository.findByName(assetName)
        if (!asset) return left(new ResourceNotFoundError(
            'Asset not found.'
        ))

        const portfolio = await this.portfolioRepository.findByInvestorId(investorId)
        if (!portfolio) return left(new ResourceNotFoundError(
            'Portfolio not found.'
        ))

        let quantityFormatted: Quantity
        if (quantity) {
            quantityFormatted = Quantity.create(quantity)

            if (quantityFormatted.getValue() < 0) quantityFormatted = quantityFormatted.multiply(-1)
        } else {
            quantityFormatted = Quantity.zero()
        }

        let priceFormatted = Money.create(price)
        if (priceFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Price must be greater than zero.'
        ))
        if (priceFormatted.getAmount() < 0) priceFormatted = priceFormatted.multiply(-1)

        let feesFormatted: Money
        if (fees) feesFormatted = Money.create(fees)
            else feesFormatted = Money.zero()

        if (feesFormatted.getAmount() < 0) feesFormatted = feesFormatted.multiply(-1)

        let incomeFormatted: Money
        if (income) incomeFormatted = Money.create(income)
            else incomeFormatted = Money.zero()

        return right({
            investor,
            asset,
            portfolio,
            quantityFormatted,
            priceFormatted,
            feesFormatted,
            incomeFormatted
        })
    }
}