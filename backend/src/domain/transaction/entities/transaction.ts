import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Money } from "@/core/value-objects/money";
import { Quantity } from "@/core/value-objects/quantity";

export enum TransactionType {
    Buy = "Buy", 
    Sell = "Sell", 
    Dividend = "Dividend"
}

export interface TransactionProps {
    transactionId: UniqueEntityID,
    portfolioId: UniqueEntityID,
    assetId: UniqueEntityID,
    transactionType: TransactionType,
    quantity: Quantity,
    price: Money,
    totalAmount: Money,
    fees: Money,
    dateAt: Date,
    createdAt: Date
    updatedAt?: Date | null,
    notes?: string
}

export class Transaction extends Entity<TransactionProps> {
    public get transactionId() {
        return this.props.transactionId
    }

    public get portfolioId() {
        return this.props.portfolioId
    }

    public get assetId() {
        return this.props.assetId
    }
    
    public get transactionType() {
        return this.props.transactionType
    }

    public get quantity() {
        return this.props.quantity
    }

    public get price() {
        return this.props.price
    }

    public get totalAmount() {
        return this.props.totalAmount
    }

    public get fees() {
        return this.props.fees
    }

    public get dateAt() {
        return this.props.dateAt
    }

    public get notes() {
        return this.props.notes ?? ''
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    public isBuyTransaction(): boolean {
        return this.props.transactionType === TransactionType.Buy
    }

    public isSellTransaction(): boolean {
        return this.props.transactionType === TransactionType.Sell
    }

    public isDividendTransaction(): boolean {
        return this.props.transactionType === TransactionType.Dividend
    }

    public set notes(newNotes: string) {
        this.props.notes = newNotes;
        this.touch()
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    public updateTransactionType(newTransactionType: TransactionType): void {
        if (newTransactionType == TransactionType.Sell) {
            this.props.totalAmount.multiply(-1)
        }

        this.props.transactionType = newTransactionType
        this.touch()
    }

    public updateQuantity(newQuantity: Quantity): void {
        this.props.quantity = newQuantity;
        this.getTotalNetAmount()
        this.touch()
    }

    public updatePrice(newPrice: Money): void {
        this.props.price = newPrice;
        this.getTotalNetAmount()
        this.touch()
    }

    public updateFees(newFees: Money): void {
        this.props.fees = newFees;
        this.getTotalNetAmount()
        this.touch()
    }

    public getTotalGrossAmount(): Money {
        return this.props.price.multiply(this.props.quantity.getValue())
    }

    public getTotalNetAmount(): Money {
        const totalGrossAmount = this.getTotalGrossAmount()
        return totalGrossAmount.subtract(this.props.fees)
    }

    public updateTotalAmount(): void {
        this.props.totalAmount = this.getTotalNetAmount()
    }
    
    public static create(props: Optional<TransactionProps, 'createdAt' | 'totalAmount'>, id?: UniqueEntityID) {
        const totalGrossAmount = props.price.multiply(props.quantity.getValue())
        const totalNetAmount = totalGrossAmount.subtract(props.fees)
        let totalAmount = totalNetAmount

        if (props.transactionType == TransactionType.Sell) {
            totalAmount = totalNetAmount.multiply(-1)
        }

        const asset = new Transaction(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                totalAmount
            }, 
            id
        )
    
        return asset
    }
}