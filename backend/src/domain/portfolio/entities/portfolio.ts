import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { TotalValue } from "../../value-objects/total-value";
import { AggregateRoot } from "@/core/entities/aggregate-root";

interface PortfolioProps {
    portfolioId: UniqueEntityID,
    userId: UniqueEntityID,
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
    
    public get userId() {
        return this.props.userId
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

    // private updateTotalValue() {
    //     const total = this.props.allocations.reduce((sum, investment) => {
    //         return sum + investment.quantity * investment.currentValue;
    //       }, 0);
      
    //       this.props.totalValue = new TotalValue(total);
    // }

    // private updateAllocations(newAllocations: Investment[]) {
    //     this.props.allocations = newAllocations;
    //     this.updateTotalValue();
    //     this.touch();
    // }

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