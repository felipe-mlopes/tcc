import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Money } from "@/core/value-objects/money";
import { Percentage } from "@/core/value-objects/percentage";
import { Quantity } from "@/core/value-objects/quantity";

interface InvestmentTransaction {
    quantity: Quantity;
    price: Money;
    date: Date;
}

export interface InvestmentProps {
    investmentId: UniqueEntityID,
    assetId: UniqueEntityID;
    quantity: Quantity;
    currentPrice: Money,
    transactions: InvestmentTransaction[];
    createdAt: Date,
    updatedAt?: Date,
}

export class Investment extends Entity<InvestmentProps> {
    public get investmentId() {
        return this.props.investmentId
    }

    public get assetId() {
        return this.props.assetId
    }

    public get quantity() {
        return this.props.quantity
    }

    public get averagePrice() {
        return this.calculateAveragePrice()
    }

    public get currentPrice() {
        return this.props.currentPrice
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    public get transactions() {
        return [...this.props.transactions] // Retorna uma cópia para manter imutabilidade
    }

    private calculateAveragePrice(): Money {
        if (this.props.transactions.length === 0) {
            return this.props.currentPrice
        }

        const totalValue = this.props.transactions.reduce((acc, transaction) => {
            const transactionValue = transaction.price.multiply(transaction.quantity.getValue())
            return acc.add(transactionValue)
        }, Money.zero(this.props.currentPrice.getCurrency()))

        const totalQuantity = this.props.transactions.reduce((acc, transaction) => {
            return acc + transaction.quantity.getValue()
        }, 0)

        if (totalQuantity === 0) {
            return this.props.currentPrice
        }

        return totalValue.divide(totalQuantity)
    }

    public getTotalInvested(): Money {
        return this.averagePrice.multiply(this.props.quantity.getValue())
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

    public updateCurrentPrice(newPrice: Money): void {
        // if (!newPrice || newPrice.getAmount() <= 0) throw new Error('Current price must be positive.')

        // if (newPrice.getCurrency() !== this.props.currentPrice.getCurrency()) throw new Error('New price must have the same currency as current price.')
        
        this.props.currentPrice = newPrice
        this.touch()
    }

    public addQuantity(additionalQuantity: Quantity, purchasePrice: Money): void {
        // if (additionalQuantity.isZero()) throw new Error('Cannot add zero quantity.')

        // if (!purchasePrice || purchasePrice.getAmount() <= 0) throw new Error('Purchase price must be positive.')

        // if (purchasePrice.getCurrency() !== this.props.currentPrice.getCurrency()) throw new Error('Purchase price must have the same currency as current price.')

        // Adiciona a transação
        this.props.transactions.push({
            quantity: additionalQuantity,
            price: purchasePrice,
            date: new Date()
        })

        // Atualiza a quantidade total
        this.props.quantity = this.props.quantity.add(additionalQuantity)
        
        this.touch()
    }

    public reduceQuantity(quantityToReduce: Quantity): void {
        // if (quantityToReduce.isZero()) throw new Error('Cannot reduce zero quantity.')

        // if (quantityToReduce.isGreaterThan(this.props.quantity)) throw new Error('Cannot reduce more quantity than available.')

        this.props.quantity = this.props.quantity.subtract(quantityToReduce)
        this.touch()
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

    public static create(
        props: Optional<Omit<InvestmentProps, 'transactions'>, 'createdAt'> & {
            initialQuantity?: Quantity;
            initialPrice?: Money;
        }, 
        id?: UniqueEntityID
    ) {
        const transactions: InvestmentTransaction[] = []
        
        // Se houver quantidade e preço inicial, cria a primeira transação
        if (props.initialQuantity && props.initialPrice) {
            transactions.push({
                quantity: props.initialQuantity,
                price: props.initialPrice,
                date: props.createdAt ?? new Date()
            })
        }

        const investment = new Investment(
            {
                ...props,
                transactions,
                createdAt: props.createdAt ?? new Date()
            },
            id
        )

        return investment
    }
}