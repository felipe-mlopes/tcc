import { Request, Response } from 'express';
import { AssetType } from '@prisma/client';
import { AssetService } from '../servives/assetService';

export class AssetController {
  static async createAsset(req: Request, res: Response) {
    try {
      const { symbol, name, assetType, sector, exchange, currency } = req.body;

      // Validações básicas
      if (!symbol || !name || !assetType || !exchange || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Symbol, name, assetType, exchange e currency são obrigatórios',
        });
      }

      // Valida se o assetType é válido
      if (!Object.values(AssetType).includes(assetType)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de ativo inválido. Valores válidos: ' + Object.values(AssetType).join(', '),
        });
      }

      const created = await AssetService.createAsset({
        symbol,
        name,
        assetType,
        sector,
        exchange,
        currency,
      });

      res.setHeader('Location', `/asset/${created.id}`)

      res.status(201).json({
        success: true,
        message: 'Ativo criado com sucesso',
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('symbol')) {
        return res.status(400).json({
          success: false,
          error: 'Símbolo já existe',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getAssetById(req: Request, res: Response) {
    try {
      const { assetId } = req.params;

      const asset = await AssetService.getAssetById(assetId);

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'Ativo não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getAssetBySymbol(req: Request, res: Response) {
    try {
      const { symbol } = req.params;

      const asset = await AssetService.getAssetBySymbol(symbol);

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: 'Ativo não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async listAssets(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      let result;
      
      if (search) {
        result = await AssetService.searchAssets(search, page, limit);
      } else {
        result = await AssetService.listAssets(page, limit);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}