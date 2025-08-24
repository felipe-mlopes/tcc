import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Portfolio } from '@/domain/portfolio/entities/portfolio';
import { Prisma, Portfolio as PrismaPortfolio } from '@prisma/client'

export class PrismaPortfolioMapper {
    static toDomain(raw: PrismaPortfolio): Portfolio {
        return Portfolio.create(
            {
                name: raw.name,
                description: raw.description,
                investorId: new UniqueEntityID(raw.investorId),
                allocations: []
            }, 
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(portfolio: Portfolio): Prisma.PortfolioUncheckedCreateInput {
        return {
            id: portfolio.id.toValue().toString(),
            name: portfolio.name,
            description: portfolio.description, 
            investorId: portfolio.investorId.toValue().toString(),
            allocations: []
        }
    }
}