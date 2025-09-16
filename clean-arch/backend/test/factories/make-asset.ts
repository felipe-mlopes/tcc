import { Injectable } from '@nestjs/common'
import { faker } from '@faker-js/faker'

import { UniqueEntityID } from "@/core/entities/unique-entity-id"

import { Asset, AssetProps, AssetType } from "@/domain/asset/entities/asset"

import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaAssetMapper } from '@/infra/database/prisma/mappers/prisma-asset-mapper'

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

@Injectable()
export class AssetFactory {
    constructor(readonly prisma: PrismaService) {}

    async makePrismaAsset(data: Partial<AssetProps> = {}): Promise<Asset> {
        const asset = makeAsset(data)

        await this.prisma.asset.create({
            data: PrismaAssetMapper.toPrisma(asset)
        })

        return asset
    }
}