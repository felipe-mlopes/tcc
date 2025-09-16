import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryInvestmentRepository } from "test/repositories/in-memory-investment-repository"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { AddInvestmentToPortfolioService } from "./add-investment-to-portfolio"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "../entities/portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"

let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryInvestmentRepository: InMemoryInvestmentRepository
let sut: AddInvestmentToPortfolioService

let newInvestor: Investor
let newAsset: Asset
let newPortfolio: Portfolio
let investorId: string
let assetId: string

describe('Add Investment to Portfolio', () => {
    beforeEach(async () => {
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryInvestmentRepository = new InMemoryInvestmentRepository()
        sut = new AddInvestmentToPortfolioService(
            inMemoryPortfolioRepository,
            inMemoryAssetRepository,
            inMemoryInvestmentRepository,
            inMemoryInvestorRepository
        )

        newInvestor = makeInvestor()
        investorId = newInvestor.id.toValue().toString()

        newAsset = makeAsset()
        assetId = newAsset.id.toValue().toString()

        newPortfolio = makePortfolio({
            investorId: newInvestor.id
        })
    })

    it('should be able to add investment to portfolio', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(newAsset)
        await inMemoryPortfolioRepository.create(newPortfolio)

        // Act
        const result = await sut.execute({
            investorId,
            assetId,
            quantity: 100,
            currentPrice: 25.50
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O investimento foi adicionado ao portfólio com sucesso')
            expect(inMemoryInvestmentRepository.items[0].quantity.getValue()).toBe(100)
            expect(inMemoryInvestmentRepository.items[0].currentPrice.getAmount()).toBe(25.50)
            expect(inMemoryInvestmentRepository.items[0].assetId.toValue().toString()).toBe(assetId)
            expect(inMemoryInvestmentRepository.items).toHaveLength(1)
        }
    })

    it('should update portfolio allocations after adding investment', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)
        await inMemoryAssetRepository.create(newAsset)
        await inMemoryPortfolioRepository.create(newPortfolio)

        // Act
        const result = await sut.execute({
            investorId,
            assetId,
            quantity: 50,
            currentPrice: 100.00
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryPortfolioRepository.items[0].allocations).toHaveLength(1)
        }
    })

    it('should not be able to add investment with non-existent investor', async () => {

        // Act
        const result = await sut.execute({
            investorId: 'non-existent-investor-id',
            assetId,
            quantity: 100,
            currentPrice: 25.50
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should not be able to add investment with non-existent asset', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(newInvestor)

        // Act
        const result = await sut.execute({
            investorId,
            assetId: 'non-existent-asset-id',
            quantity: 100,
            currentPrice: 25.50
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Asset not found.')
        }
    })

    it('should not be able to add investment without portfolio', async () => {

        // Arrange
        const investorWithoutPortfolio = makeInvestor()
        await inMemoryInvestorRepository.create(investorWithoutPortfolio)
        await inMemoryAssetRepository.create(newAsset)
        const investorWithoutPortfolioId = investorWithoutPortfolio.id.toValue().toString()

        // Act
        const result = await sut.execute({
            investorId: investorWithoutPortfolioId,
            assetId,
            quantity: 100,
            currentPrice: 25.50
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Portfolio not found.')
        }
    })

})