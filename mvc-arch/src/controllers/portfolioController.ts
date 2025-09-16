import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PortfolioService } from '../servives/portfolioService';

export class PortfolioController {
  static async createPortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description } = req.body;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Nome do portfólio é obrigatório',
        });
      }

      await PortfolioService.createPortfolio(investorId, {
        name,
        description,
      });

      res.status(201).json({
        success: true,
        message: 'Portfólio criado com sucesso',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async addInvestment(req: AuthenticatedRequest, res: Response) {
    try {
      const { assetId, quantity, currentPrice } = req.body;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!assetId || !quantity || !currentPrice) {
        return res.status(400).json({
          success: false,
          error: 'AssetId, quantity e currentPrice são obrigatórios',
        });
      }

      if (quantity <= 0 || currentPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade e preço devem ser maiores que zero',
        });
      }

      await PortfolioService.addInvestment(investorId, {
        assetId,
        quantity,
        currentPrice,
      });

      res.status(201).json({
        success: true,
        message: 'Investimento adicionado com sucesso'
      });
    } catch (error: any) {
      if (error.message.includes('Nenhum portfólio encontrado')) {
        return res.status(400).json({
          success: false,
          error: 'Você precisa criar um portfólio antes de adicionar investimentos',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async updateInvestmentAfterTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      await PortfolioService.updateInvestmentAfterTransaction(transactionId);

      res.status(200).json({
        success: true,
        message: 'Investimento atualizado com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getInvestmentByAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { assetId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const investment = await PortfolioService.getInvestmentByAsset(investorId, assetId);

      if (!investment) {
        return res.status(404).json({
          success: false,
          error: 'Investimento não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: investment,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getInvestments(req: AuthenticatedRequest, res: Response) {
    try {
      const investorId = req.investor?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const result = await PortfolioService.getInvestments(investorId, page, limit);

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

  static async getPortfolios(req: AuthenticatedRequest, res: Response) {
    try {
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const portfolios = await PortfolioService.getPortfoliosByInvestor(investorId);

      res.status(200).json({
        success: true,
        data: portfolios,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getPortfolioById(req: AuthenticatedRequest, res: Response) {
    try {
      const { portfolioId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const portfolio = await PortfolioService.getPortfolioById(investorId, portfolioId);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfólio não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: portfolio,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}