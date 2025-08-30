import { Injectable } from "@nestjs/common"
import { faker } from '@faker-js/faker'

import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { TotalValue } from "@/core/value-objects/total-value"

import { Portfolio, PortfolioProps } from "@/domain/portfolio/entities/portfolio"

import { PrismaService } from "@/infra/database/prisma/prisma.service"
import { PrismaPortfolioMapper } from "@/infra/database/prisma/mappers/prisma-portfolio-mapper"

export function makePortfolio(
    override: Partial<PortfolioProps> = {},
    id?: UniqueEntityID
) {
    const fakerName = faker.lorem.word()
    const fakerTotalValue = new TotalValue(faker.number.float())

    const portfolio = Portfolio.create(
        {
            investorId: new UniqueEntityID(),
            name: fakerName,
            totalValue: fakerTotalValue,
            allocations: [],
            ...override
        },
        id
    )

    return portfolio
}

@Injectable()
export class PortfolioFactory {
    constructor(private prisma: PrismaService) {}

    async makePrismaPortfolio(data: Partial<PortfolioProps> = {}): Promise<Portfolio> {
        const portfolio = makePortfolio(data)

        await this.prisma.portfolio.create({
            data: PrismaPortfolioMapper.toPrisma(portfolio)
        })

        return portfolio
    }
}