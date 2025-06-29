import { faker } from '@faker-js/faker'
import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Asset, AssetProps, AssetType } from "@/domain/asset/entities/asset"

export function makeAsset(
    override: Partial<AssetProps> = {},
    id?: UniqueEntityID
) {
    const fakerSymbol = faker.hacker.abbreviation()
    const fakerName = faker.internet.username()
    const fakerSector = faker.lorem.word()
    const fakerExchange = faker.company.name()
    const fakerCurrency = faker.finance.currencyCode()

    const asset = Asset.create(
        {
            asserId: new UniqueEntityID(),
            symbol: fakerSymbol,
            name: fakerName,
            assetType: AssetType.Stock,
            sector: fakerSector,
            exchange: fakerExchange,
            currency: fakerCurrency,            
            ...override
        },
        id
    )

    return asset
}