import { IsString, IsEnum, IsOptional } from 'class-validator';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsEnum(AssetType)
  type: AssetType;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
