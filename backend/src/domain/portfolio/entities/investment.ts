import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Money } from "@/core/value-objects/money";
import { Percentage } from "@/core/value-objects/percentage";
import { Quantity } from "@/core/value-objects/quantity";

export interface InvestmentTransaction {
    quantity: Quantity
    price: Money
    date: Date
    transactionId: UniqueEntityID
}

export interface InvestmentYield {
    yieldId: UniqueEntityID
    incomeValue: Money
    date: Date,
}

export interface InvestmentProps {
    portfolioId: UniqueEntityID
    assetId: UniqueEntityID
    quantity: Quantity
    currentPrice: Money
    transactions: InvestmentTransaction[]
    yields: InvestmentYield[]
    createdAt: Date
    updatedAt?: Date
}

export class Investment extends Entity<InvestmentProps> {
    public get portfolioId() {
        return this.props.portfolioId
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

    public get yields() {
        return [...this.props.yields] // Retorna uma cópia para manter imutabilidade
    }

    private calculateAveragePrice(): Money {
        // Filtrar apenas transações de compra para o cálculo do preço médio
        const buyTransactions = this.props.transactions.filter(
            t => t.quantity.getValue() > 0
        )

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
        this.props.currentPrice = newPrice
        this.touch()
    }

    public includeTransaction({
        transactionId,
        quantity,
        price,
        date
    }: InvestmentTransaction): void {
        this.props.transactions.push({
            transactionId,
            quantity,
            price,
            date
        })
        
        this.touch()
    }

    public includeYield({
        yieldId,
        incomeValue,
        date
    }: InvestmentYield): void {
        this.yields.push({
            yieldId,
            incomeValue,
            date
        })

        this.touch()
    }

    public addQuantity({
        transactionId,
        quantity,
        price,
        date
    }: InvestmentTransaction): void {
        // Adiciona a transação
        this.props.transactions.push({
            transactionId,
            quantity,
            price,
            date
        })

        // Atualiza a quantidade total
        this.props.quantity = this.props.quantity.add(quantity)
        
        this.touch()
    }

    public reduceQuantity({
        transactionId,
        quantity,
        price,
        date
    }: InvestmentTransaction): void {
        // Adiciona a transação
        this.props.transactions.push({
            transactionId,
            quantity,
            price,
            date
        })

        // Atualiza a quantidade total
        this.props.quantity = this.props.quantity.subtract(quantity)
        
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

    public belongsToPortfolio(portfolioId: UniqueEntityID): boolean {
        return this.props.portfolioId.equals(portfolioId)
    }

    public equals(other: Investment): boolean {
        return this.id.equals(other.id);
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    public static create(
        props: Optional<Omit<InvestmentProps, 'transactions' | 'yields'>, 'createdAt'> & {
            transactionId?: string;
            initialQuantity?: Quantity;
            initialPrice?: Money;
            dateAt?: Date
        }, 
        id?: UniqueEntityID
    ) {
        const transactions: InvestmentTransaction[] = []
        const yields: InvestmentYield[] = []
        const createdAt = props.createdAt ?? new Date()
        
        // Se houver quantidade e preço inicial, cria a primeira transação
        if (props.initialQuantity && props.initialPrice) {
            transactions.push({
                transactionId: new UniqueEntityID(props.transactionId) ?? '',
                quantity: props.initialQuantity,
                price: props.initialPrice,
                date: props.dateAt ?? new Date()
            })
        }

        const investment = new Investment(
            {
                ...props,
                transactions,
                yields,
                createdAt
            },
            id
        )

        return investment
    }
}