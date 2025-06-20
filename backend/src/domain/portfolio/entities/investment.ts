import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Quantity } from "../../value-objects/quantity";
import { Money } from "../../value-objects/money";
import { Optional } from "@/core/types/optional";
import { Percentage } from "../../value-objects/percentage";

export interface InvestmentProps {
    investmentId: UniqueEntityID,
    assetId: UniqueEntityID;
    quantity: Quantity;
    averagePrice: Money,
    currentPrice: Money
    createdAt: Date,
    updatedAt?: Date,
}

export class Investment extends Entity<InvestmentProps> {
    get investmentId() {
        return this.props.investmentId
    }

    get assetId() {
        return this.props.assetId
    }

    get quantity() {
        return this.props.quantity.getValue()
    }

    get averagePrice() {
        return this.props.averagePrice
    }

    get currentPrice() {
        return this.props.currentPrice
    }

    get createdAt() {
        return this.props.createdAt
    }

    get updateAt() {
        return this.props.updatedAt
    }

    public getTotalInvested(): Money {
        return this.props.averagePrice.multiply(this.props.quantity.getValue())
    }

    public getCurrentValue(): Money {
        return this.props.currentPrice.multiply(this.props.quantity.getValue())
    }

    public getProfitLoss(): Money {
        return this.getCurrentValue().subtract(this.getTotalInvested())
    }

    public getProfitLossPercentage(): Percentage {
        const totalInvested = this.getTotalInvested()
        if (totalInvested.getAmount() === 0) return Percentage.zero()

        const profitLoss = this.getProfitLoss()
        const percentageDecimal = profitLoss.getAmount() / totalInvested.getAmount()

        return Percentage.fromDecimal(percentageDecimal)
    }

    public addQuantity(additionalQuantity: Quantity, purchasePrice: Money): void {
        if (additionalQuantity.isZero()) throw new Error('Cannot add zero quantity.')

        const currentTotalValue = this.getTotalInvested()
        const additionalValue = purchasePrice.multiply(additionalQuantity.getValue())
        const newTotalValue = currentTotalValue.add(additionalValue)

        this.props.quantity = this.props.quantity.add(additionalQuantity)

        this.props.averagePrice = newTotalValue.divide(this.props.quantity.getValue())
        this.touch()

        this.validateInvariant()
    }

    public reduceQuantity(quantityToReduce: Quantity): void {
        if (quantityToReduce.isZero()) throw new Error('Cannot reduce zero quantity.')

        if (quantityToReduce.isGreaterThan(this.props.quantity)) throw new Error('Cannot reduce more quantity than available.')
            
        this.props.quantity = this.props.quantity.subtract(quantityToReduce)
        this.touch()

        this.validateInvariant()
    }

    public hasQuantity(): boolean {
        return !this.props.quantity.isZero();
    }

    public isInProfit(): boolean {
        return this.getProfitLoss().getAmount() > 0
    }

    public isInLoss(): boolean {
        return this.getProfitLoss().getAmount() < 0
    }

    public equals(other: Investment): boolean {
        return this.id.equals(other.id);
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    private validateInvariant(): void {
        if(!this.props.quantity || this.props.quantity.getValue() < 0) throw new Error('Investment quantity must be non-negative.')
        
        if(!this.props.averagePrice || this.props.averagePrice.getAmount() <= 0) throw new Error('Investment average price must be positive.')

        if(!this.props.currentPrice || this.props.currentPrice.getAmount() <= 0) throw new Error('Investment current price must be positive.')

        if(this.props.averagePrice.getCurrency() !== this.props.currentPrice.getCurrency()) throw new Error('Average price and current price must have the same currency.')
    }

    public static create(props: Optional<InvestmentProps, 'createdAt'>, id?: UniqueEntityID) {
        const investiment = new Investment(
            {
                ...props,
                createdAt: props.createdAt ?? new Date()
            },
            id
        )

        return investiment
    }
}