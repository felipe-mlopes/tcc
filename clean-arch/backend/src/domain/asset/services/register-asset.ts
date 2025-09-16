import { Either, right } from "@/shared/exceptions/either";
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
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
    id: string,
    message: string
}>

@Injectable()
export class RegisterAssetService {
    constructor(readonly assetRepository: AssetRepository) {}

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
            id: newAsset.id.toValue().toString(),
            message: 'O cadastro do ativo foi realizado com sucesso'
        })
    }
}