import { Asset } from "@/domain/asset/entities/asset";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";

export class InMemoryAssetRepository implements AssetRepository {
    public items: Asset[] = []
    
    async findById(id: string): Promise<Asset | null> {
        const asset = this.items.find(item => item.id.toString() === id)

        if (!asset) return null

        return asset
    }

    async findByName(name: string): Promise<Asset | null> {
        const asset = this.items.find(item => item.name === name)

        if (!asset) return null

        return asset
    }

    async create(asset: Asset): Promise<void> {
        this.items.push(asset)
    }

    async update(asset: Asset): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === asset.id)

        this.items[itemIndex] = asset
    }

    async delete(asset: Asset): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === asset.id)
        
        this.items.splice(itemIndex, 1)
    }
}