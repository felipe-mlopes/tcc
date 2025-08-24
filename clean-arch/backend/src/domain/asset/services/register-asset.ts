import { Either, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Asset, AssetType } from "../entities/asset";
import { AssetRepository } from "../repositories/asset-repository";
import { Injectable } from "@nestjs/common";

interface RegisterAssetServiceRequest {
    symbol: string,
    name: string,
    assetType: AssetType,
    sector: string,
    exchange: string,
    currency: string
}

type RegisterAssetServiceResponse = Either<ResourceNotFoundError, {
    message: string
}>

@Injectable()
export class RegisterAssetService {
    constructor(private assetRepository: AssetRepository) {}

    public async execute({
        symbol,
        name,
        assetType,
        sector,
        exchange,
        currency
    }: RegisterAssetServiceRequest): Promise<RegisterAssetServiceResponse> {
        const newAsset = Asset.create({
            symbol,
            name,
            assetType,
            sector,
            exchange,
            currency
        })

        await this.assetRepository.create(newAsset)

        return right({
            message: 'O cadastro do ativo foi realizado com sucesso'
        })
    }
}