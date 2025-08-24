import { Asset } from "@/domain/asset/entities/asset";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PrismaAssetMapper } from "../mappers/prisma-asset-mapper";

@Injectable()
export class PrismaAssetRepository implements AssetRepository {
    constructor(private prisma: PrismaService) {}
    
    async findById(id: string): Promise<Asset | null> {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
        });

        if (!asset) {
            return null;
        }

        return PrismaAssetMapper.toDomain(asset);
    }
    
    async findByName(name: string): Promise<Asset | null> {
        const asset = await this.prisma.asset.findFirst({
            where: { name },
        });

        if (!asset) {
            return null;
        }

        return PrismaAssetMapper.toDomain(asset);
    }
    
    async create(asset: Asset): Promise<void> {
        const data = PrismaAssetMapper.toPrisma(asset);
        await this.prisma.asset.create({ data });
    }
    
    async update(asset: Asset): Promise<void> {
        const data = PrismaAssetMapper.toPrisma(asset);
        await this.prisma.asset.update({ 
            where: { 
                id: asset.id.toValue().toString() 
            }, 
            data 
        });
    }
    
    async delete(asset: Asset): Promise<void> {
        const assetId = asset.id.toValue().toString();
        await this.prisma.asset.delete({ where: { id: assetId } }); 
    }
}