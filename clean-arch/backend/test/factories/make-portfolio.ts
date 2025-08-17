import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { TotalValue } from "@/core/value-objects/total-value"
import { Portfolio, PortfolioProps } from "@/domain/portfolio/entities/portfolio"
import { faker } from '@faker-js/faker'

export function makePortfolio(
    override: Partial<PortfolioProps> = {},
    id?: UniqueEntityID
) {
    const fakerName = faker.lorem.word()
    const fakerTotalValue = new TotalValue(faker.number.float())

    const portfolio = Portfolio.create(
        {
            portfolioId: new UniqueEntityID(),
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