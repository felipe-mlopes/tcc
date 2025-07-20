import { TransactionValidatorService } from "./transaction-validator"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let sut: TransactionValidatorService

describe('Transaction Validator Service', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        sut = new TransactionValidatorService(
            inMemoryInvestorRepository,
            inMemoryAssetRepository,
            inMemoryPortfolioRepository
        )
    })

    it('should be able to validate transaction with positive quantity, price and fees', async () => {
        const investor = makeInvestor()
        const asset = makeAsset({ name: "AAPL34" })
        const portfolio = makePortfolio({ investorId: investor.id })

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: asset.name,
            quantity: 10,
            price: 100,
            fees: 1.5
        })

        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(result.value.investor.id).toEqual(investor.id)
            expect(result.value.asset.id).toEqual(asset.id)
            expect(result.value.portfolio.id).toEqual(portfolio.id)
            expect(result.value.quantityFormatted.getValue()).toBe(10)
            expect(result.value.priceFormatted.getAmount()).toBe(100)
            expect(result.value.feesFormatted.getAmount()).toBe(1.5)
        }
    })

    it('should be not able to validate transaction if investor does not exist', async () => {
        const result = await sut.validate({
            investorId: 'non-existent',
            assetName: 'AAPL34',
            quantity: 10,
            price: 100,
            fees: 1
        })

        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to validate transaction if asset does not exist', async () => {
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: 'non-existent',
            quantity: 10,
            price: 100,
            fees: 1
        })

        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Asset not found.')
        }
    })

    it('should be not able to validate transaction if portfolio does not exist', async () => {
        const investor = makeInvestor()
        const asset = makeAsset({ name: 'AAPL34' })

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: asset.name,
            quantity: 10,
            price: 100,
            fees: 1
        })

        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Portfolio not found.')
        }
    })

    it('should be not able to validate transaction if quantity is zero or negative', async () => {
        const investor = makeInvestor()
        const asset = makeAsset({ name: 'AAPL34' })
        const portfolio = makePortfolio({ investorId: investor.id })

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: asset.name,
            quantity: 0,
            price: 100,
            fees: 1
        })

        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Quantity must be greater than zero.')
        }
    })

    it('should be not able to validate transaction if price is zero or negative', async () => {
        const investor = makeInvestor()
        const asset = makeAsset({ name: 'AAPL34' })
        const portfolio = makePortfolio({ investorId: investor.id })

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: asset.name,
            quantity: 10,
            price: 0,
            fees: 1
        })

        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Price must be greater than zero.')
        }
    })

    it('should be not able to validate transaction if fees is zero or negative', async () => {
        const investor = makeInvestor()
        const asset = makeAsset({ name: 'AAPL34' })
        const portfolio = makePortfolio({ investorId: investor.id })

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        const result = await sut.validate({
            investorId: investor.id.toValue().toString(),
            assetName: asset.name,
            quantity: 10,
            price: 100,
            fees: 0
        })

        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Fees must be greater than zero.')
        }
    })
})
