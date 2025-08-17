import { Asset } from "../entities/asset";

export interface AssetRepository {
    findById(id: string): Promise<Asset | null>
    findByName(name: string): Promise<Asset | null>
    create(asset: Asset): Promise<void>
    update(asset: Asset): Promise<void>
    delete(asset: Asset): Promise<void>
}