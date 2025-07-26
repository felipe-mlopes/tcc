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

    let quantityFaker: Quantity
    let incomeFaker: Money
    let feesFaker: Money
    let totalAmountFaker: Money

    const priceFaker = Money.create(faker.number.float({
        fractionDigits: 2
    }))

    if (transactionType !== TransactionType.Dividend) {
        quantityFaker = Quantity.create(faker.number.int())
        incomeFaker = Money.zero()
        feesFaker = Money.create(faker.number.float({
            fractionDigits: 2
        }))
        totalAmountFaker = priceFaker.multiply(quantityFaker.getValue())
    } else {
        quantityFaker = Quantity.zero()
        incomeFaker = Money.create(faker.number.float({
            fractionDigits: 2
        }))
        feesFaker = Money.zero()
        totalAmountFaker = Money.zero()
    }

    const transaction = Transaction.create(
        {
            portfolioId: new UniqueEntityID(),
            assetId: new UniqueEntityID(),
            transactionType: transactionType,
            quantity: quantityFaker,
            price: priceFaker,
            income: incomeFaker,
            totalAmount: totalAmountFaker,
            fees: feesFaker,
            dateAt: new Date(),
            ...override
        },
        id
    )

    return transaction
}