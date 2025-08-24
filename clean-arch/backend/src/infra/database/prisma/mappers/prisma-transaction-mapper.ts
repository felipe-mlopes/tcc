import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Money } from "@/core/value-objects/money";
import { Quantity } from "@/core/value-objects/quantity";
import { Transaction } from "@/domain/transaction/entities/transaction";
import { Prisma, Transaction as PrismaTransaction } from "@prisma/client";

export class PrismaTransactionMapper {
    static toDomain(raw: PrismaTransaction): Transaction {
        return Transaction.create(
            {
                portfolioId: new UniqueEntityID(raw.portfolioId),
                assetId: new UniqueEntityID(raw.assetId),
                transactionType: raw.transactionType as Transaction['transactionType'],
                quantity: Quantity.create(raw.quantity.toNumber()),
                price: Money.create(raw.price.toNumber()),
                income: raw.income ? Money.create(raw.income.toNumber()) : undefined,
                totalAmount: Money.create(raw.totalAmount.toNumber()),
                fees: Money.create(raw.fees.toNumber()),
                dateAt: raw.dateAt
            }, 
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(investiment: Transaction): Prisma.TransactionUncheckedCreateInput  {
        return {
            id: investiment.id.toValue().toString(),
            portfolioId: investiment.portfolioId.toValue().toString(),
            assetId: investiment.assetId.toValue().toString(),
            transactionType: investiment.transactionType,
            quantity: investiment.quantity.getValue(),
            price: investiment.price.getAmount(),
            income: investiment.income ? investiment.income.getAmount() : null,
            totalAmount: investiment.totalAmount.getAmount(),
            fees: investiment.fees.getAmount(),
            dateAt: investiment.dateAt
        }
    }
}