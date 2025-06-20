import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Money } from "@/domain/value-objects/money";

enum TransactionType {
    Buy = "Buy", 
    Sell = "Sell", 
    Dividend = "Dividend", 
    Split = "Split"
}

interface TransactionProps {
    transactionId: UniqueEntityID,
    portfolioId: UniqueEntityID,
    assetId: UniqueEntityID,
    transactionType: TransactionType,
    quantity: number,
    price: Money,
    totalAmount: Money,
    fees: Money,
    date: Date,
    notes: string
}

export class Transaction extends Entity<TransactionProps> {}