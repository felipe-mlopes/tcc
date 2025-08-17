import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"
import { Investment, InvestmentProps } from "@/domain/portfolio/entities/investment"
import { faker } from "@faker-js/faker"

export function makeInvestment(
    override: Partial<InvestmentProps> = {},
    id?: UniqueEntityID
) {
    const fakerQuantity = Quantity.create(faker.number.int())
    const fakerCurrentPrice = Money.create(faker.number.float())

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