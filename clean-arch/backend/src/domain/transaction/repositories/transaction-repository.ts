import { PaginationParams } from "@/core/repositories/pagination-params"
import { Transaction } from "../entities/transaction"

export abstract class TransactionRepository {
    abstract findById(id: string): Promise<Transaction | null>
    abstract findManyByPortfolioId(
        portfolioId: string, 
        params: PaginationParams
    ): Promise<Transaction[]>
    abstract findByManyPortfolioAndAsset(
        portfolioId: string, 
        assetId: string, 
        params: PaginationParams
    ): Promise<Transaction[]>
    abstract create(transaction: Transaction): Promise<void>
    abstract update(transaction: Transaction): Promise<void>
    abstract delete(transactionId: string): Promise<void>
}