import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Money } from '@/core/value-objects/money';
import { Quantity } from '@/core/value-objects/quantity';
import { Investment } from '@/domain/portfolio/entities/investment';
import { Prisma, Investment as PrismaInvestment } from '@prisma/client'

export class PrismaInvestmentMapper {
    static toDomain(raw: PrismaInvestment): Investment {
        return Investment.create(
            {
                portfolioId: new UniqueEntityID(raw.portfolioId),
                assetId: new UniqueEntityID(raw.assetId),
                quantity: Quantity.create(raw.quantity.toNumber()),
                currentPrice: Money.create(raw.currentPrice.toNumber())
            }, 
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(investiment: Investment): Prisma.InvestmentUncheckedCreateInput  {
        return {
            id: investiment.id.toValue().toString(),
            portfolioId: investiment.portfolioId.toValue().toString(),
            assetId: investiment.assetId.toValue().toString(),
            quantity: investiment.quantity.getValue(),
            currentPrice: investiment.currentPrice.getAmount()
        }
    }
}