import { InMemoryTransactionRepository } from "test/repositories/in-memory-transaction-repository"
import { UpdateTransactionService } from "./update-transaction"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { Transaction, TransactionType } from "../entities/transaction"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "@/domain/portfolio/entities/portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { makeTransaction } from "test/factories/make-transaction"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryTransactionRepository: InMemoryTransactionRepository
let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let sut: UpdateTransactionService

let investor: Investor
let asset: Asset
let portfolio: Portfolio
let transaction: Transaction

describe('Edit Transaction Service', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        inMemoryTransactionRepository = new InMemoryTransactionRepository()
        sut = new UpdateTransactionService(
            inMemoryInvestorRepository,
            inMemoryTransactionRepository
        )

        investor = makeInvestor()
        asset = makeAsset()
        portfolio = makePortfolio({
            investorId: investor.id
        })
        transaction = makeTransaction(
            {
                assetId: asset.id,
                portfolioId: portfolio.id
            },
            TransactionType.Buy
        )
    })

    it('should be able to edit a transaction when all fields are filled', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: transaction.transactionType,
            quantity: 20,
            price: 50,
            fees: 2.0
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Transação atualizada com sucesso')   
            expect(inMemoryTransactionRepository.items[0].quantity.getValue()).toBe(20)
            expect(inMemoryTransactionRepository.items[0].price.getAmount()).toBe(50)
            expect(inMemoryTransactionRepository.items[0].fees.getAmount()).toBe(2.0)
            expect(inMemoryTransactionRepository.items[0].totalAmount.getAmount()).toBe(998)
        }
    })

    it('should be able to edit a transaction when at least one field is filled', async () => {

        // Arrange
        const newTransaction = makeTransaction(
                {
                assetId: asset.id,
                portfolioId: portfolio.id,
                price: Money.create(100),
                fees: Money.create(10)
            },
            TransactionType.Dividend
        )    

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: newTransaction.id.toValue().toString(),
            transactionType: newTransaction.transactionType,
            quantity: 20
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryTransactionRepository.items[0].quantity.getValue()).toBe(20)
            expect(inMemoryTransactionRepository.items[0].price.getAmount()).toBe(100)
            expect(inMemoryTransactionRepository.items[0].fees.getAmount()).toBe(10)
            expect(inMemoryTransactionRepository.items[0].totalAmount.getAmount()).toBe(1990)
        }
    })

    it('should be able to edit a transaction when only type is changed', async () => {

        // Arrange
        const newTransaction = makeTransaction(
                {
                assetId: asset.id,
                portfolioId: portfolio.id,
                quantity: Quantity.create(5),
                price: Money.create(100),
                fees: Money.create(10)
            },
            TransactionType.Sell
        )

        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: newTransaction.id.toValue().toString(),
            transactionType: TransactionType.Sell
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryTransactionRepository.items[0].transactionType).toBe(TransactionType.Sell)
            expect(inMemoryTransactionRepository.items[0].quantity.getValue()).toBe(5)
            expect(inMemoryTransactionRepository.items[0].price.getAmount()).toBe(100)
            expect(inMemoryTransactionRepository.items[0].fees.getAmount()).toBe(10)
            expect(inMemoryTransactionRepository.items[0].totalAmount.getAmount()).toBe(-490)
        }
    })

    it('should be able to edit a transaction when quantity entered was negative', async () => {
                
        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            quantity: -10
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryTransactionRepository.items[0].quantity.getValue()).toBe(10)
        }
    })

    it('should be able to edit a transaction when price entered was negative', async () => {
                
        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            price: -100
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryTransactionRepository.items[0].price.getAmount()).toBe(100)
        }
    })

    it('should be able to edit a transaction when fees entered was negative', async () => {
                
        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            fees: -1
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(inMemoryTransactionRepository.items[0].fees.getAmount()).toBe(1)
        }
    })

    it('should be not able to edit a transaction if investor does not exist', async () => {

        // Arrange
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: 'non-existent',
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to edit a transaction if investor does not exist', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: 'non-existent',
            transactionType: TransactionType.Buy
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Transaction not found.')
        }
    })

    it('should be not able to edit a transaction if no updatable fields are provided', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: undefined as any,
            quantity: undefined,
            price: undefined,
            fees: undefined
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('At least one transaction field must be provided.')
        }
    })

    it('should be not able to edit a transaction if quantity is zero', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            quantity: 0
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Quantity must be greater than zero.')
        }
    })

    it('should be not able to edit a transaction if price is zero', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            price: 0
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Price must be greater than zero.')
        }
    })

    it('should be not able to edit a transaction if fees is zero', async () => {

        // Arrange
        await inMemoryInvestorRepository.create(investor)
        await inMemoryAssetRepository.create(asset)
        await inMemoryPortfolioRepository.create(portfolio)
        await inMemoryTransactionRepository.create(transaction)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            transactionId: transaction.id.toValue().toString(),
            transactionType: TransactionType.Buy,
            fees: 0
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Fees must be greater than zero.')
        }
    })
})