import { Injectable } from "@nestjs/common"
import { faker } from "@faker-js/faker"

import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"

import { Investment, InvestmentProps } from "@/domain/portfolio/entities/investment"

import { PrismaService } from "@/infra/database/prisma/prisma.service"
import { PrismaInvestmentMapper } from "@/infra/database/prisma/mappers/prisma-investment-mapper"

export function makeInvestment(
    override: Partial<InvestmentProps> = {},
    id?: UniqueEntityID
) {
    const fakerQuantity = Quantity.create(faker.number.int({
        min: 1,
        max: 10000
    }))
    const fakerCurrentPrice = Money.create(faker.number.float({
        min: 0,
        max: 1000,
        fractionDigits: 2
    }))

    const investment = Investment.create(
        {
            portfolioId: new UniqueEntityID(),
            assetId: new UniqueEntityID(),
            quantity: fakerQuantity,
            currentPrice: fakerCurrentPrice,
            transactions: [],
            ...override
        },
        id
    )

    return investment
}

@Injectable()
export class InvestmentFactory {
    constructor(private prisma: PrismaService) {}

    async makePrismaInvestment(data: Partial<InvestmentProps> = {}): Promise<Investment> {
        const investment = makeInvestment(data)

        await this.prisma.investment.create({
            data: PrismaInvestmentMapper.toPrisma(investment)
        })

        return investment
    }
}