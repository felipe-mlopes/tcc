import { InMemoryAssetRepository } from "test/repositories/in-memory-asset-repository";
import { RegisterAssetService } from "./register-asset";
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

        if(result.isRight()) {
            const { message, id } = result.value

            expect(message).toBe('O cadastro do ativo foi realizado com sucesso')
            expect(typeof id).toBe('string')
            expect(inMemoryAssetRepository.items[0].symbol).toBe(asset.symbol)
            expect(inMemoryAssetRepository.items[0].name).toBe(asset.name)
            expect(inMemoryAssetRepository.items[0].assetType).toBe(asset.assetType)
            expect(inMemoryAssetRepository.items[0].sector).toBe(asset.sector)
            expect(inMemoryAssetRepository.items[0].exchange).toBe(asset.exchange)
            expect(inMemoryAssetRepository.items[0].currency).toBe(asset.currency)
            expect(inMemoryAssetRepository.items).toHaveLength(1)
        }
    })
})