import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository";
import { RegisterAssetService } from "./register-asset";
import { Asset, AssetType } from "../entities/asset";
import { makeAsset } from "test/factories/make-asset";

let inMemoryAssetRepository: InMemoryAssetRepository
let sut: RegisterAssetService

describe('Register Asset', () => {
    beforeEach(() => {
        inMemoryAssetRepository = new InMemoryAssetRepository()
        sut = new RegisterAssetService(inMemoryAssetRepository)
    })

    it('should be able to register a asset', async () => {
        const asset = makeAsset()

        const result = await sut.execute({
            symbol: asset.symbol, 
            name: asset.name,
            assetType: asset.assetType,
            sector: asset.sector,
            exchange: asset.exchange,
            currency: asset.currency
        })

        expect(result.isRight()).toBe(true)

        const { newAsset } = result.value as { newAsset: Asset }
        expect(inMemoryAssetRepository.items[0]).toEqual(newAsset)
    })
})