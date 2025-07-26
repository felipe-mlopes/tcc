import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { GetInvestmentByAssetIdService } from "./get-investment-by-asset-id"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "../entities/portfolio"
import { InMemoryInvestmentRepository } from "test/repositories/in-memory-investment-repository"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { makeInvestment } from "test/factories/make-investment"
import { Quantity } from "@/core/value-objects/quantity"
import { Money } from "@/core/value-objects/money"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"

let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryInvestmentRepository: InMemoryInvestmentRepository
let sut: GetInvestmentByAssetIdService

let newInvestor: Investor
let newAsset: Asset
let newPortfolio: Portfolio
let investorId: string
let assetId: string

describe('Get Investment By AssetId', () => {
    beforeEach(() => {
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryInvestmentRepository = new InMemoryInvestmentRepository()
        sut = new GetInvestmentByAssetIdService(
            inMemoryInvestorRepository,
            inMemoryAssetRepository,
            inMemoryPortfolioRepository,
            inMemoryInvestmentRepository
        )

        newInvestor = makeInvestor()
        investorId = newInvestor.id.toValue().toString()

        newAsset = makeAsset()
        assetId = newAsset.id.toValue().toString()

        newPortfolio = makePortfolio({
            investorId: newInvestor.id
        })
    })

    it('should be able to get investment by asset id', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(newAsset)
        await inMemoryPortfolioRepository.create(newPortfolio)

        const newInvestment = makeInvestment({
            portfolioId: newPortfolio.id,
            assetId: newAsset.id,
            quantity: Quantity.create(10),
            currentPrice: Money.create(50)
        })
        await inMemoryInvestmentRepository.create(newInvestment)

        // Act
        const result = await sut.execute({
            investorId,
            assetId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { investment } = result.value
            
            expect(investment).toEqual(inMemoryInvestmentRepository.items[0])
            expect(investment?.quantity.getValue()).toBe(10)
            expect(investment?.currentPrice.getAmount()).toBe(50)
        }
    })
    
    it('should be able to get null by asset id', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(newAsset)
        await inMemoryPortfolioRepository.create(newPortfolio)

        // Act
        const result = await sut.execute({
            investorId,
            assetId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { investment } = result.value
            
            expect(investment).toBeNull()
        }
    })
    
    it('should be not able to get investment with non-existent investor', async () => {

        // Act
        const result = await sut.execute({
            investorId: 'non-existent-investor-id',
            assetId,
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to get investment with non-existent asset', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)

        // Act
        const result = await sut.execute({
            investorId,
            assetId: 'non-existent-asset-id'
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Asset not found.')
        }
    })

    it('should be not able to get investment without portfolio', async () => {

        // Arrange
        const investorWithoutPortfolio = makeInvestor()
        await inMemoryInvestorRepository.create(investorWithoutPortfolio)
        await inMemoryAssetRepository.create(newAsset)
        const investorWithoutPortfolioId = investorWithoutPortfolio.id.toValue().toString()

        // Act
        const result = await sut.execute({
            investorId: investorWithoutPortfolioId,
            assetId
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Portfolio not found.')
        }
    })
})