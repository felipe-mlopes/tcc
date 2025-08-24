import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";
import { PrismaService } from "../prisma.service";
import { PaginationParams } from "@/core/repositories/pagination-params";
import { Transaction } from "@/domain/transaction/entities/transaction";
import { PrismaTransactionMapper } from "../mappers/prisma-transaction-mapper";

export class PrismaTransactionRepository implements TransactionRepository {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<Transaction | null> {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
        });

        if (!transaction) {
            return null;
        }

        return PrismaTransactionMapper.toDomain(transaction);
    }

    async findManyByPortfolioId(portfolioId: string, params: PaginationParams): Promise<Transaction[]> {
        const transactions = await this.prisma.transaction.findMany({
            where: { portfolioId },
            skip: params.page * params.page,
            take: params.page,
        });

        return transactions.map(PrismaTransactionMapper.toDomain);
    }

    async findByManyPortfolioAndAsset(portfolioId: string, assetId: string, params: PaginationParams): Promise<Transaction[]> {
        const transactions = await this.prisma.transaction.findMany({
            where: { portfolioId, assetId },
            skip: params.page * params.page,
            take: params.page,
        });

        return transactions.map(PrismaTransactionMapper.toDomain);
    }

    async create(transaction: Transaction): Promise<void> {
        const data = PrismaTransactionMapper.toPrisma(transaction);
        await this.prisma.transaction.create({ data });
    }

    async update(transaction: Transaction): Promise<void> {
        const data = PrismaTransactionMapper.toPrisma(transaction);
        await this.prisma.transaction.update({ 
            where: { id: transaction.id.toValue().toString() }, 
            data
        });    
    }

    async delete(transactionId: string): Promise<void> {
        await this.prisma.transaction.delete({ where: { id: transactionId } }); 
    }

}