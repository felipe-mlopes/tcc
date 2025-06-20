import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Money } from "@/domain/value-objects/money";

enum PriceType {
    Open = "Open",
    Close = "Close",
    High = "High",
    Low = "Low"
}

interface AssetPriceTProps {
    assetPriceId: UniqueEntityID,
    assetId: UniqueEntityID,
    price: Money,
    date: Date,
    priceType: PriceType
}

export class AssetPrice extends AggregateRoot<AssetPriceTProps> {}