import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Portfolio } from "../entities/portfolio"
import { InMemoryInvestmentRepository } from "test/repositories/in-memory-investment-repository"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { makeInvestment } from "test/factories/make-investment"
import { Quantity } from "@/core/value-objects/quantity"
import { Money } from "@/core/value-objects/money"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { FetchAllInvestmentsByPortfolioIdService } from "./fetch-all-investments-by-portfolio-id"

let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryInvestmentRepository: InMemoryInvestmentRepository
let sut: FetchAllInvestmentsByPortfolioIdService

let newInvestor: Investor
let newPortfolio: Portfolio
let investorId: string

describe('Fetch All Investments By PortfolioId', () => {
    beforeEach(() => {
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryInvestmentRepository = new InMemoryInvestmentRepository()
        sut = new FetchAllInvestmentsByPortfolioIdService(
            inMemoryInvestorRepository,
            inMemoryPortfolioRepository,
            inMemoryInvestmentRepository
        )

        newInvestor = makeInvestor()
        investorId = newInvestor.id.toValue().toString()

        newPortfolio = makePortfolio({
            investorId: newInvestor.id
        })
    })

    it('should be able to fetch all investiments by portfolio id', async () => {

        // Arrange
        const asset1 = makeAsset()
        const asset2 = makeAsset()

        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(asset1)
        await inMemoryAssetRepository.create(asset2)
        await inMemoryPortfolioRepository.create(newPortfolio)

        const investment1 = makeInvestment({
            portfolioId: newPortfolio.id,
            assetId: asset1.id,
            quantity: Quantity.create(10),
            currentPrice: Money.create(50)
        })
        await inMemoryInvestmentRepository.create(investment1)

        const investment2 = makeInvestment({
            portfolioId: newPortfolio.id,
            assetId: asset2.id,
            quantity: Quantity.create(20),
            currentPrice: Money.create(100)
        })
        await inMemoryInvestmentRepository.create(investment2)

        // Act
        const result = await sut.execute({
            investorId,
            page: 1
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { investment } = result.value
            
            expect(investment).toHaveLength(2)
            expect(investment[0].quantity.getValue()).toBe(10)
            expect(investment[0].currentPrice.getAmount()).toBe(50)
            expect(investment[1].quantity.getValue()).toBe(20)
            expect(investment[1].currentPrice.getAmount()).toBe(100)
        }
    })
    
    it('should be able to fetch investments, returning an empty list if no investments are found', async () => {

        // Arrange
        const newAsset = makeAsset()

        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(newAsset)
        await inMemoryPortfolioRepository.create(newPortfolio)

        // Act
        const result = await sut.execute({
            investorId,
            page: 1
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { investment } = result.value
            
            expect(investment).toHaveLength(0)
        }
    })

    it('should be able to paginated all investiments by portfolio id', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryPortfolioRepository.create(newPortfolio)

        const assets = []
        const investments = []

        for (let i = 1; i <= 22; i++) {
            const asset = makeAsset()
            assets.push(asset)
            await inMemoryAssetRepository.create(asset)

            const investment = makeInvestment({
                portfolioId: newPortfolio.id,
                assetId: asset.id,
                quantity: Quantity.create(i * 10),
                currentPrice: Money.create(i * 5)
            })
            investments.push(investment)
            await inMemoryInvestmentRepository.create(investment)
        }

        // Act
        const result = await sut.execute({
            investorId,
            page: 2
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { investment } = result.value
            
            expect(investment).toHaveLength(2)
            expect(investment[0].quantity.getValue()).toBe(210) // 21 * 10
            expect(investment[0].currentPrice.getAmount()).toBe(105) // 21 * 5
            expect(investment[1].quantity.getValue()).toBe(220) // 22 * 10
            expect(investment[1].currentPrice.getAmount()).toBe(110) // 22 * 5
        }
    })
    
    it('should be not able to get investment with non-existent investor', async () => {

        // Act
        const result = await sut.execute({
            investorId: 'non-existent-investor-id',
            page: 1
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to get investment without portfolio', async () => {

        // Arrange
        const newAsset = makeAsset()

        const investorWithoutPortfolio = makeInvestor()
        await inMemoryInvestorRepository.create(investorWithoutPortfolio)
        await inMemoryAssetRepository.create(newAsset)
        const investorWithoutPortfolioId = investorWithoutPortfolio.id.toValue().toString()

        // Act
        const result = await sut.execute({
            investorId: investorWithoutPortfolioId,
            page: 1
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Portfolio not found.')
        }
    })
})