import { PaginationParams } from "@/core/repositories/pagination-params"
import { Transaction } from "../entities/transaction"

export interface TransactionRepository {
    findById(id: string): Promise<Transaction | null>
    findManyByPortfolioId(portfolioId: string, params: PaginationParams): Promise<Transaction[]>
    findManyByUserId(userId: string, params: PaginationParams): Promise<Transaction[]>
    create(transaction: Transaction): Promise<void>
    update(transaction: Transaction): Promise<void>
    delete(transaction: Transaction): Promise<void>
}