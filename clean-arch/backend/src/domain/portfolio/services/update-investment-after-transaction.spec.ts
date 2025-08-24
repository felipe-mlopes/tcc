import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { InMemoryInvestmentRepository } from "test/repositories/in-memory-investment-repository"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryTransactionRepository } from "test/repositories/in-memory-transaction-repository"
import { UpdateInvestmentAfterTransactionService } from "./update-investment-after-transaction"
import { Investor } from "@/domain/investor/entities/investor"
import { Investment } from "../entities/investment"
import { Transaction, TransactionType } from "@/domain/transaction/entities/transaction"
import { Asset } from "@/domain/asset/entities/asset"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makeInvestment } from "test/factories/make-investment"
import { Quantity } from "@/core/value-objects/quantity"
import { Money } from "@/core/value-objects/money"
import { makeTransaction } from "test/factories/make-transaction"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository 
let inMemoryInvestmentRepository: InMemoryInvestmentRepository
let inMemoryTransactionRepository: InMemoryTransactionRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let sut: UpdateInvestmentAfterTransactionService

let newInvestor: Investor
let newInvestment: Investment
let newTransaction: Transaction
let newAsset: Asset
let investorId: string
let investmentId: string
let transactionId: string

describe('Update Investment After Transaction', () => {
    beforeEach(async () => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryInvestmentRepository = new InMemoryInvestmentRepository()
        inMemoryTransactionRepository = new InMemoryTransactionRepository()
        inMemoryAssetRepository = new InMemoryAssetRepository()
        sut = new UpdateInvestmentAfterTransactionService(
            inMemoryInvestorRepository,
            inMemoryInvestmentRepository,
            inMemoryTransactionRepository,
            inMemoryAssetRepository
        )

        newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)
        investorId = newInvestor.id.toValue().toString()

        newAsset = makeAsset()
        await inMemoryAssetRepository.create(newAsset)

        newInvestment = makeInvestment({
            assetId: newAsset.id,
            quantity: Quantity.create(100),
            currentPrice: Money.create(25.00)
        })
        investmentId = newInvestment.id.toValue().toString()
    })

    it('should be able to update an existing investment after a buy transaction', async () => {

        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
                quantity: Quantity.create(50),
                price: Money.create(30.0)
            },
            TransactionType.Buy
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryInvestmentRepository.create(newInvestment)
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value
            const { quantity, currentPrice, transactions } = inMemoryInvestmentRepository.items[0]

            expect(message).toBe('Após a inclusão da transação, o investimento foi atualizado com sucesso')
            expect(quantity.getValue()).toBe(150) // 100 + 50
            expect(currentPrice.getAmount()).toBe(30.0)
            expect(transactions).toHaveLength(1)
            expect(transactions[0].quantity.getValue()).toBe(50)
            expect(transactions[0].price.getAmount()).toBe(30.0)
        }
    })
    
    it('should be able to update an existing investment after a sell transaction', async () => {

        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
                quantity: Quantity.create(50),
                price: Money.create(30.0),
            },
            TransactionType.Sell
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryInvestmentRepository.create(newInvestment)
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { quantity, currentPrice, transactions } = inMemoryInvestmentRepository.items[0]

            expect(quantity.getValue()).toBe(50) // 100 - 50
            expect(currentPrice.getAmount()).toBe(30.00)
            expect(transactions).toHaveLength(1)
            expect(transactions[0].quantity.getValue()).toBe(50)
            expect(transactions[0].price.getAmount()).toBe(30.0)
        }
    })
    
    it('should be able to update an existing investment after a dividend transaction', async () => {
        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
                price: Money.create(30.0),
                income: Money.create(1.5)
            },
            TransactionType.Dividend
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryInvestmentRepository.create(newInvestment)
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { currentPrice, transactions, yields } = inMemoryInvestmentRepository.items[0]

            expect(currentPrice.getAmount()).toBe(30.0)
            expect(transactions).toHaveLength(0)
            expect(yields).toHaveLength(1)
            expect(yields[0].incomeValue.getAmount()).toBe(1.5)
        }
    })
    
    it('should be able to create new investment after a buy transaction when none exists', async () => {

        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
                quantity: Quantity.create(50),
                price: Money.create(30.0)
            },
            TransactionType.Buy
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const createdInvestment = inMemoryInvestmentRepository.items[0]
        
            expect(createdInvestment.quantity.getValue()).toBe(50)
            expect(createdInvestment.currentPrice.getAmount()).toBe(30.0)
            expect(createdInvestment.transactions).toHaveLength(1)

            if (createdInvestment.transactions.length > 0) {
                expect(createdInvestment.transactions[0].quantity.getValue()).toBe(50)
                expect(createdInvestment.transactions[0].price.getAmount()).toBe(30.0)
            }
        }
    })
    
    it('should be not able to update an investment with non-existent investor', async () => {

        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
                quantity: Quantity.create(50),
                price: Money.create(30.0)
            },
            TransactionType.Buy
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryInvestmentRepository.create(newInvestment)
        await inMemoryTransactionRepository.create(newTransaction)
                
        // Act
        const result = await sut.execute({
            investorId: 'non-existent',
            transactionId
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe(
                'Investor not found.'
            )
        }
    })
    
    it('should be not able to update an investment with non-existent transaction', async () => {
               
        // Act
        const result = await sut.execute({
            investorId,
            transactionId: 'non-existent'
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe(
                'Transaction not found.'
            )
        }
    })
    
    it('should be not able to update an investment with non-existent asset', async () => {

        // Arrange
        const investmentFaker = makeInvestment()
        await inMemoryInvestmentRepository.create(investmentFaker)

        newTransaction = makeTransaction(
            {
                portfolioId: investmentFaker.portfolioId,
                quantity: Quantity.create(50),
                price: Money.create(30.0)
            },
            TransactionType.Buy
        )
        transactionId = newTransaction.id.toValue().toString()

        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe(
                'Asset not found.'
            )
        }
    })
    
    it('should be not able to update an investment when transaction type is not supported', async () => {

        // Arrange
        await inMemoryInvestmentRepository.create(newInvestment)

        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId,
            },
            'Transfer' as TransactionType
        )

        transactionId = newTransaction.id.toValue().toString()
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Unsupported transaction type.'
            )
        }
    })
    
    it('should be not able to update an investment when calculation method fails', async () => {

        // Arrange
        newTransaction = makeTransaction(
            {
                assetId: newAsset.id,
                portfolioId: newInvestment.portfolioId
            },
            TransactionType.Sell
        )

        transactionId = newTransaction.id.toValue().toString()
        await inMemoryTransactionRepository.create(newTransaction)

        // Act
        const result = await sut.execute({
            investorId,
            transactionId
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Only buy transactions are allowed for this operation.'
            )
        }
    })
})