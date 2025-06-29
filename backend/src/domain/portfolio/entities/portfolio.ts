import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { AggregateRoot } from "@/core/entities/aggregate-root";
import { TotalValue } from "@/core/value-objects/total-value";

export interface PortfolioProps {
    portfolioId: UniqueEntityID,
    investorId: UniqueEntityID,
    name: string,
    description?: string,
    createdAt: Date,
    updatedAt?: Date,
    totalValue: TotalValue,
    allocations: Array<string>
}

export class Portfolio extends AggregateRoot<PortfolioProps> {
    
    public get portfolioId() {
        return this.props.portfolioId
    }
    
    public get investorId() {
        return this.props.investorId
    }

    public get name() {
        return this.props.name
    }

    public get description() {
        return this.props.description || ''
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    public get totalValue() {
        return this.props.totalValue.getValue()
    }

    public get allocations() {
        return this.props.allocations
    }
    
    public set description(newDescription : string) {
        this.props.description = newDescription;
        this.touch()
    }

    private touch() {
        this.props.updatedAt = new Date()
    }

    public increaseTotalValue(quantity: number, price: number) {
        const newInvestment = quantity * price
        new TotalValue(newInvestment)
        const totalValue = this.props.totalValue.getValue() + newInvestment

        this.props.totalValue = new TotalValue(totalValue)
    }

    public decreaseTotalValue(quantity: number, price: number) {
        const newInvestment = quantity * price
        new TotalValue(newInvestment)
        const totalValue = this.props.totalValue.getValue() - newInvestment

        this.props.totalValue = new TotalValue(totalValue)
    }

    public updateAllocation(newAllocation: string) {
        this.props.allocations.push(newAllocation);
        this.touch();
    }

    static create(props: Optional<PortfolioProps, 'createdAt' | 'totalValue'>, id?: UniqueEntityID) {
        const portfolio = new Portfolio(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                totalValue: props.totalValue ?? TotalValue.zero()
            }, 
            id
        )
    
        return portfolio
    }
}