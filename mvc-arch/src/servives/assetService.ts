import { PrismaClient, AssetType } from '@prisma/client';

const prisma = new PrismaClient();

export class AssetService {
  static async createAsset(data: {
    symbol: string;
    name: string;
    assetType: AssetType;
    sector?: string;
    exchange: string;
    currency: string;
  }) {
    const asset = await prisma.asset.create({
      data: {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        assetType: data.assetType,
        sector: data.sector,
        exchange: data.exchange.toUpperCase(),
        currency: data.currency.toUpperCase(),
      },
    });

    return asset;
  }

  static async getAssetById(assetId: string) {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    return asset;
  }

  static async getAssetBySymbol(symbol: string) {
    const asset = await prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    return asset;
  }

  static async listAssets(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count(),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async searchAssets(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where: {
          OR: [
            { symbol: { contains: query.toUpperCase(), mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.asset.count({
        where: {
          OR: [
            { symbol: { contains: query.toUpperCase(), mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateAsset(assetId: string, data: {
    name?: string;
    assetType?: AssetType;
    sector?: string;
    exchange?: string;
    currency?: string;
  }) {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.assetType) updateData.assetType = data.assetType;
    if (data.sector) updateData.sector = data.sector;
    if (data.exchange) updateData.exchange = data.exchange.toUpperCase();
    if (data.currency) updateData.currency = data.currency.toUpperCase();

    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
    });

    return asset;
  }
}