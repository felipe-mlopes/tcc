import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

enum AssetType {
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
    isActive: boolean
}

export class Asset extends AggregateRoot<AssetProps> {}