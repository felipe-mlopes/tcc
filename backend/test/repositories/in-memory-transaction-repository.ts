import { PaginationParams } from "@/core/repositories/pagination-params";
import { Transaction } from "@/domain/transaction/entities/transaction";
import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";

export class InMemoryTransactionRepository implements TransactionRepository {
    public items: Transaction[] = []

    async findById(id: string): Promise<Transaction | null> {
        const transaction = this.items.find(
            item => item.id.toString() === id
        )

        if (!transaction) return null

        return transaction
    }

    async findManyByPortfolioId(portfolioId: string, { page }: PaginationParams): Promise<Transaction[]> {
        const transactions = this.items
            .filter(item => item.portfolioId.toString() === portfolioId)
            .slice((page - 1) * 20, page * 20)
        
        return transactions
    }

    async findByManyPortfolioAndAsset(
        portfolioId: string, 
        assetId: string,
        { page }: PaginationParams
    ): Promise<Transaction[]> {
        const transactions = this.items
            .filter(item => item.portfolioId.toString() === portfolioId && item.assetId.toString() === assetId)
            .slice((page - 1) * 20, page * 20)

        return transactions
    }

    async create(transaction: Transaction): Promise<void> {
        this.items.push(transaction)
    }

    async update(transaction: Transaction): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === transaction.id)

        this.items[itemIndex] = transaction
    }

    async delete(transactionId: string): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id.toString() === transactionId)
        
        this.items.splice(itemIndex, 1)
    }

}