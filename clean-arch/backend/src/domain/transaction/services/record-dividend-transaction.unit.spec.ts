import { InMemoryTransactionRepository } from "test/repositories/in-memory-transaction-repository"
import { TransactionValidatorService } from "./transaction-validator"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "@/domain/portfolio/entities/portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { TransactionType } from "../entities/transaction"
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { RecordDividendTransactionService } from "./record-dividend-transaction"

let inMemoryTransactionRepository: InMemoryTransactionRepository
let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let validator: TransactionValidatorService
let sut: RecordDividendTransactionService

let investor: Investor
let asset: Asset
let portfolio: Portfolio

describe('Record Dividend Transaction Service', () => {
    beforeEach(() => {
        inMemoryTransactionRepository = new InMemoryTransactionRepository()
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        validator = new TransactionValidatorService(
                    inMemoryInvestorRepository,
                    inMemoryAssetRepository,
                    inMemoryPortfolioRepository
                )
        sut = new RecordDividendTransactionService(
            inMemoryTransactionRepository,
            validator
        )

        investor = makeInvestor()
        asset = makeAsset()
        portfolio = makePortfolio({
            investorId: investor.id
        })
    })

    it('should be able to record dividend transaction', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Dividend,
            price: 100,
            income: 10,
            dateAt: new Date()
        })
        
        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message, id } = result.value

            expect(message).toBe('A transação de dividendo foi registrada com sucesso')
            expect(typeof id).toBe('string')
            expect(inMemoryTransactionRepository.items[0].assetId).toBe(asset.id)
            expect(inMemoryTransactionRepository.items[0].portfolioId).toBe(portfolio.id)
            expect(inMemoryTransactionRepository.items[0].transactionType).toBe(TransactionType.Dividend)
            expect(inMemoryTransactionRepository.items[0].price.getAmount()).toBe(100)
            expect(inMemoryTransactionRepository.items[0].income?.getAmount()).toBe(10)
        }
    })

    it('should be not able to record dividend with transaction type other than dividend', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            price: 100,
            income: 1.5,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Only dividend transactions are allowed for this operation.'
            )
        }
    })

    it('should be not able to record dividend if investor does not exist', async () => {

        // Act
        const result = await sut.execute({
            investorId: 'non-existent',
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Dividend,
            price: 100,
            income: 1.5,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to record dividend if asset does not exist', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: 'non-existent',
            transactionType: TransactionType.Dividend,
            price: 100,
            income: 1.5,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Asset not found.')
        }
    })

    it('should be not able to record dividend if portfolio does not exist', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Dividend,
            price: 100,
            income: 1.5,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Portfolio not found.')
        }
    })

    it('should be not able to record dividend if price is zero', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Dividend,
            price: 0,
            income: 1.5,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Price must be greater than zero.'
            )
        }
    })

    it('should be not able to record dividend if income is zero', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            assetId: asset.id.toValue().toString(),
            transactionType: TransactionType.Dividend,
            price: 100,
            income: 0,
            dateAt: new Date()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Income must be greater than zero.'
            )
        }
    })
})