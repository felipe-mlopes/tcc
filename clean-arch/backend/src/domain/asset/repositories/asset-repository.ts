import { Asset } from "../entities/asset";

export abstract class AssetRepository {
    abstract findById(id: string): Promise<Asset | null>
    abstract findByName(name: string): Promise<Asset | null>
    abstract create(asset: Asset): Promise<void>
    abstract update(asset: Asset): Promise<void>
    abstract delete(asset: Asset): Promise<void>
}