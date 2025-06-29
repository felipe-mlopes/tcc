import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

export enum AssetType {
    Stock = "Stock",
    ETF = "ETF",
    FIIs = "FIIs",
    Bond = "Bond",
    Crypto = "Crypto"
}

export interface AssetProps {
    asserId: UniqueEntityID,
    symbol: string,
    name: string,
    assetType: AssetType,
    sector: string,
    exchange: string,
    currency: string,
    createdAt: Date,
    updatedAt?: Date | null,
    isActive: boolean
}

export class Asset extends AggregateRoot<AssetProps> {
    public get assedId() {
        return this.props.asserId
    }

    public get symbol() {
        return this.props.symbol
    }
    
    public get name() {
        return this.props.name
    }
    
    public get sector() {
        return this.props.sector
    }
    
    public get exchange() {
        return this.props.exchange
    }
    
    public get currency() {
        return this.props.currency
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    public get isActive() {
        return this.props.isActive
    }
    
    private touch() {
        this.props.updatedAt = new Date()
    }

    public desactive() {
        this.props.isActive = false
        this.touch()
    }

    public static create(props: Optional<AssetProps, 'createdAt' | 'isActive'>, id?: UniqueEntityID) {
        const asset = new Asset(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                isActive: true
            }, 
            id
        )
    
        return asset
    }
}