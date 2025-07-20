import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { InMemoryTransactionRepository } from "test/repositories/in-memory-transaction-repository"
import { FetchTransactionsHistoryByAssetIdService } from "./fetch-transactions-history-by-asset-id"
import { Investor } from "@/domain/investor/entities/investor"
import { Asset } from "@/domain/asset/entities/asset"
import { Portfolio } from "@/domain/portfolio/entities/portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { makeAsset } from "test/factories/make-asset"
import { makePortfolio } from "test/factories/make-portfolio"
import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository"
import { makeTransaction } from "test/factories/make-transaction"
import { TransactionType } from "../entities/transaction"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryAssetRepository: InMemoryAssetRepository
let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryTransactionRepository: InMemoryTransactionRepository
let sut: FetchTransactionsHistoryByAssetIdService

let investor: Investor
let asset: Asset
let portfolio: Portfolio

describe('Fetch Transactions History By AssetId Service', () => {
    beforeEach(() => {
    inMemoryInvestorRepository = new InMemoryInvestorRepository()
    inMemoryAssetRepository = new InMemoryAssetRepository()
    inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
    inMemoryTransactionRepository = new InMemoryTransactionRepository()

    sut = new FetchTransactionsHistoryByAssetIdService(
      inMemoryInvestorRepository,
      inMemoryPortfolioRepository,
      inMemoryTransactionRepository
    )

    investor = makeInvestor()
    asset = makeAsset()
    portfolio = makePortfolio({
        investorId: investor.id
    })
  })

  it('should be able to fetch transactions history by asset id', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)
    await inMemoryAssetRepository.create(asset)
    await inMemoryPortfolioRepository.create(portfolio)

    const transaction1 = makeTransaction(
        {
            portfolioId: portfolio.id,
            assetId: asset.id
        },
        TransactionType.Buy
    )

    const transaction2 = makeTransaction(
        {
            portfolioId: portfolio.id,
            assetId: asset.id
        },
        TransactionType.Buy
    )

    await inMemoryTransactionRepository.create(transaction1)
    await inMemoryTransactionRepository.create(transaction2)

    // Act
    const result = await sut.execute({
        assetId: asset.id.toValue().toString(),
        investorId: investor.id.toValue().toString(),
        page: 1
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        expect(inMemoryTransactionRepository.items).toHaveLength(2)
        expect(inMemoryTransactionRepository.items[0].assetId).toBe(asset.id)
        expect(inMemoryTransactionRepository.items[1].assetId).toBe(asset.id)
    }
  })

  it('should be not able to fetch transaction history if investor does not exist', async () => {

    // Arrange
    await inMemoryAssetRepository.create(asset)

    // Act
    const result = await sut.execute({
        assetId: asset.id.toValue().toString(),
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
    await inMemoryAssetRepository.create(asset)
    await inMemoryInvestorRepository.create(investor)

    // Act
    const result = await sut.execute({
        assetId: asset.id.toValue().toString(),
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

  it('should be able to fetch transaction history, returning an empty list if no transactions are found for a given asset', async () => {

    // Arrange
    await inMemoryInvestorRepository.create(investor)
    await inMemoryAssetRepository.create(asset)
    await inMemoryPortfolioRepository.create(portfolio)

    // Act
    const result = await sut.execute({
        assetId: asset.id.toValue().toString(),
        investorId: investor.id.toValue().toString(),
        page: 1
    })

    // Assert
    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
        expect(inMemoryTransactionRepository.items).toHaveLength(0)
    }
  })
})