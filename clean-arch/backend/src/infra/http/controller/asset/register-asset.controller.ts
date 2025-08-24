import { BadRequestException, Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { z } from "zod";

import { RegisterAssetService } from "@/domain/asset/services/register-asset";
import { AssetType } from "@/domain/asset/entities/asset";
import { Public } from "@/infra/auth/public";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { ApiTags } from "@nestjs/swagger";

const assetTypeValues = Object.values(AssetType) as [AssetType, ...AssetType[]]

const registerAssetBodySchema = z.object({
    symbol: z.string().min(3).max(5),
    name: z.string().min(3),
    assetType: z.enum(assetTypeValues),
    sector: z.string(),
    exchange: z.string(),
    currency: z.string().min(3).max(3)
});

type RegisterAssetBody = z.infer<typeof registerAssetBodySchema>;

@ApiTags('assets')
@Controller('/asset')
@Public()
export class RegisterAssetController {
    constructor(private registerAssetService: RegisterAssetService) {}

    @Post()
    async handle(@Body() body: RegisterAssetBody): Promise<void> {
        const { name, symbol, assetType, sector, exchange, currency } = body;

        const result = await this.registerAssetService.execute({
            name,
            symbol,
            assetType,
            sector,
            exchange,
            currency
        });

        if (result.isLeft()) {
            const error = result.value;

            switch (error.constructor) {
                case ResourceNotFoundError:
                    throw new NotFoundException(error.message);
                default:
                    throw new BadRequestException();
            }
        }   
    }
}