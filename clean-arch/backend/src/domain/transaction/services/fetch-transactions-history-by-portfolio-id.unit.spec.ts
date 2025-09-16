import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { InMemoryTransactionRepository } from "test/repositories/in-memory-transaction-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "@/domain/portfolio/entities/portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { makeTransaction } from "test/factories/make-transaction"
import { TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { FetchTransactionsHistoryByPorfolioIdService } from "./fetch-transactions-history-by-portfolio-id"
import { Quantity } from "@/core/value-objects/quantity"
import { Money } from "@/core/value-objects/money"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryTransactionRepository: InMemoryTransactionRepository
let sut: FetchTransactionsHistoryByPorfolioIdService

let investor: Investor
let asset1: Asset
let asset2: Asset
let portfolio: Portfolio

describe('Fetch Transactions History By PortfolioId Service', () => {
    beforeEach(() => {
    inMemoryInvestorRepository = new InMemoryInvestorRepository()
    inMemoryAssetRepository = new InMemoryAssetRepository()
    inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
    inMemoryTransactionRepository = new InMemoryTransactionRepository()

    sut = new FetchTransactionsHistoryByPorfolioIdService(
      inMemoryInvestorRepository,
      inMemoryPortfolioRepository,
      inMemoryTransactionRepository
    )

    investor = makeInvestor()
    asset1 = makeAsset()
    asset2 = makeAsset()
    portfolio = makePortfolio({
        investorId: investor.id
    })
  })

  it('should be able to fetch transactions history by portfolio id', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)
    await inMemoryAssetRepository.create(asset1)
    await inMemoryAssetRepository.create(asset2)
    await inMemoryPortfolioRepository.create(portfolio)

    const transaction1 = makeTransaction(
        {
            portfolioId: portfolio.id,
            assetId: asset1.id
        },
        TransactionType.Buy
    )

    const transaction2 = makeTransaction(
        {
            portfolioId: portfolio.id,
            assetId: asset2.id
        },
        TransactionType.Buy
    )

    await inMemoryTransactionRepository.create(transaction1)
    await inMemoryTransactionRepository.create(transaction2)

    // Act
    const result = await sut.execute({
        investorId: investor.id.toValue().toString(),
        page: 1
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        expect(inMemoryTransactionRepository.items).toHaveLength(2)
        expect(inMemoryTransactionRepository.items[0].assetId).toBe(asset1.id)
        expect(inMemoryTransactionRepository.items[1].assetId).toBe(asset2.id)
    }
  })

  it('should be able to fetch transaction history, returning an empty list if no transactions are found', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)
    await inMemoryAssetRepository.create(asset1)
    await inMemoryAssetRepository.create(asset2)
    await inMemoryPortfolioRepository.create(portfolio)

    // Act
    const result = await sut.execute({
        investorId: investor.id.toValue().toString(),
        page: 1
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        expect(inMemoryTransactionRepository.items).toHaveLength(0)
    }
  })

  it('should be able to paginated all transactions history by portfolio id', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)
    await inMemoryPortfolioRepository.create(portfolio)

    const assets = []
    const transactions = []

    for (let i = 1; i <= 22; i++) {
        const asset = makeAsset()
        assets.push(asset)
        await inMemoryAssetRepository.create(asset)

        const transaction = makeTransaction(
            {
                portfolioId: portfolio.id,
                assetId: asset.id,
                quantity: Quantity.create(i * 10),
                price: Money.create(i * 5),
                fees: Money.create(i)
            },
            TransactionType.Buy
        )
        transactions.push(transaction)
        await inMemoryTransactionRepository.create(transaction)
    }

    // Act
    const result = await sut.execute({
        investorId: investor.id.toValue().toString(),
        page: 2
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        const { transactions } = result.value
        
        expect(transactions).toHaveLength(2)
        expect(transactions[0].quantity.getValue()).toBe(210) // 21 * 10
        expect(transactions[0].price.getAmount()).toBe(105) // 21 * 5
        expect(transactions[0].fees.getAmount()).toBe(21)
        expect(transactions[1].quantity.getValue()).toBe(220) // 22 * 10
        expect(transactions[1].price.getAmount()).toBe(110) // 22 * 5
        expect(transactions[1].fees.getAmount()).toBe(22)
    }
  })

  it('should be not able to fetch transaction history if investor does not exist', async () => {

    // Act
    const result = await sut.execute({
        investorId: 'non-existent',
        page: 1
    })

    // Assert
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError)
        expect(result.value.message).toBe(
            'Investor not found'
        )
    }
  })

  it('should be not able to fetch transaction history if portfolio does not exist', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)

    // Act
    const result = await sut.execute({
        investorId: investor.id.toValue().toString(),
        page: 1
    })

    // Assert
    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(ResourceNotFoundError)
        expect(result.value.message).toBe(
            'Portfolio not found'
        )
    }
  })
})