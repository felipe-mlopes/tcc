import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Money } from "@/core/value-objects/money"
import { Quantity } from "@/core/value-objects/quantity"
import { Transaction, TransactionProps, TransactionType } from "@/domain/transaction/entities/transaction"
import { faker } from "@faker-js/faker"

export function makeTransaction(
    override: Partial<TransactionProps> = {},
    transactionType: TransactionType,
    id?: UniqueEntityID
) {
    const fakerQuantity = Quantity.create(faker.number.int())
    const fakerPrice = Money.create(faker.number.float())
    const fakerFees = Money.create(faker.number.float())

    const transaction = Transaction.create(
        {
            portfolioId: new UniqueEntityID(),
            assetId: new UniqueEntityID(),
            transactionType: transactionType,
            quantity: fakerQuantity,
            price: fakerPrice,
            totalAmount: fakerPrice.multiply(fakerPrice.getAmount()),
            fees: fakerFees,
            dateAt: new Date(),
            ...override
        },
        id
    )

    return transaction
}