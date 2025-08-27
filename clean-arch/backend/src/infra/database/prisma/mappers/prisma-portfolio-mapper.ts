import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { TotalValue } from '@/core/value-objects/total-value';
import { Portfolio } from '@/domain/portfolio/entities/portfolio';
import { Prisma, Portfolio as PrismaPortfolio } from '@prisma/client'

export class PrismaPortfolioMapper {
    static toDomain(raw: PrismaPortfolio): Portfolio {
        return Portfolio.create(
            {
                name: raw.name,
                description: raw.description || undefined,
                investorId: new UniqueEntityID(raw.investorId),
                allocations: raw.allocations || [], // Usar o valor do banco ou array vazio
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt || undefined,
                totalValue: raw.totalValue ? new TotalValue(raw.totalValue.toNumber()) : TotalValue.zero()
            }, 
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(portfolio: Portfolio): Prisma.PortfolioUncheckedCreateInput {
        return {
            id: portfolio.id.toValue().toString(),
            name: portfolio.name,
            description: portfolio.description || null, 
            investorId: portfolio.investorId.toValue().toString(),
            allocations: portfolio.allocations,
            totalValue: portfolio.totalValue,
            createdAt: portfolio.createdAt,
            updatedAt: portfolio.updatedAt || null
        }
    }
}