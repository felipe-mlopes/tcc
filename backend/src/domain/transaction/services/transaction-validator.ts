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
    quantity: number
    price: number
    fees: number
}

type TransactionValidatorServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    investor: Investor
    asset: Asset
    portfolio: Portfolio
    quantityFormatted: Quantity
    priceFormatted: Money
    feesFormatted: Money
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
        fees
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

        let quantityFormatted = Quantity.create(quantity)
        if (quantityFormatted.isZero()) return left(new NotAllowedError(
            'Quantity must be greater than zero.'
        ))
        if (quantityFormatted.getValue() < 0) {
            quantityFormatted = quantityFormatted.multiply(-1)
        }

        let priceFormatted = Money.create(price)
        if (priceFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Price must be greater than zero.'
        ))
        if (priceFormatted.getAmount() < 0) {
            priceFormatted = priceFormatted.multiply(-1)
        }

        let feesFormatted = Money.create(fees)
        if (feesFormatted.getAmount() == 0) return left(new NotAllowedError(
            'Fees must be greater than zero.'
        ))
        if (feesFormatted.getAmount() < 0) {
            feesFormatted = feesFormatted.multiply(-1)
        }

        return right({
            investor,
            asset,
            portfolio,
            quantityFormatted,
            priceFormatted,
            feesFormatted
        })
    }
}