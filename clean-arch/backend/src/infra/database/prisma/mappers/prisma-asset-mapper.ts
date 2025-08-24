import { Prisma, Asset as PrismaAsset } from '@prisma/client'
import { Asset } from "@/domain/asset/entities/asset";
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class PrismaAssetMapper {
    static toDomain(raw: PrismaAsset): Asset {
        return Asset.create(
            {
                name: raw.name,
                assetType: raw.assetType as Asset["assetType"],
                symbol: raw.symbol,
                sector: raw.sector,
                exchange: raw.exchange,
                currency: raw.currency,
            },
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(asset: Asset): Prisma.AssetUncheckedCreateInput {
        return {
            id: asset.id.toValue().toString(),
            name: asset.name,
            assetType: asset.assetType,
            symbol: asset.symbol,
            sector: asset.sector,
            exchange: asset.exchange,
            currency: asset.currency,
        }
    }
}