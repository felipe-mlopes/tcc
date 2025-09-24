import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TransactionType } from '@prisma/client';
import { TransactionService } from '../servives/transactionService';

export class TransactionController {
  static async createBuyTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { quantity, price, fees, dateAt } = req.body;
      const { assetId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!assetId || !quantity || !price || !dateAt) {
        return res.status(400).json({
          success: false,
          error: 'AssetId, quantity, price e dateAt são obrigatórios',
        });
      }

      if (quantity <= 0 || price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade e preço devem ser maiores que zero',
        });
      }

      if (new Date(dateAt) > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data da transação não pode ser futura',
        });
      }

      const created = await TransactionService.createBuyTransaction(investorId, {
        assetId,
        quantity,
        price,
        fees,
        dateAt,
      });

      res.setHeader('Location', `/transaction/${created.id}`)

      res.status(201).json({
        success: true,
        message: 'Transação de compra registrada com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('Nenhum portfólio encontrado')) {
        return res.status(400).json({
          success: false,
          error: 'Você precisa criar um portfólio antes de registrar transações',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async createSellTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { quantity, price, fees, dateAt } = req.body;
      const { assetId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!assetId || !quantity || !price || !dateAt) {
        return res.status(400).json({
          success: false,
          error: 'AssetId, quantity, price e dateAt são obrigatórios',
        });
      }

      if (quantity <= 0 || price <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade e preço devem ser maiores que zero',
        });
      }

      if (new Date(dateAt) > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data da transação não pode ser futura',
        });
      }

      const created = await TransactionService.createSellTransaction(investorId, {
        assetId,
        quantity,
        price,
        fees,
        dateAt,
      });

      res.setHeader('Location', `/transaction/${created.id}`)

      res.status(201).json({
        success: true,
        message: 'Transação de venda registrada com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('Quantidade insuficiente')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('Nenhum portfólio encontrado')) {
        return res.status(400).json({
          success: false,
          error: 'Você precisa criar um portfólio antes de registrar transações',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async createDividendTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { quantity, price, income, dateAt } = req.body;
      const { assetId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!assetId || !quantity || !price || !income || !dateAt) {
        return res.status(400).json({
          success: false,
          error: 'AssetId, quantity, price, income e dateAt são obrigatórios',
        });
      }

      if (quantity <= 0 || price <= 0 || income <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade, preço e renda devem ser maiores que zero',
        });
      }

      if (new Date(dateAt) > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data da transação não pode ser futura',
        });
      }

      const created = await TransactionService.createDividendTransaction(investorId, {
        assetId,
        quantity,
        price,
        income,
        dateAt,
      });

      res.setHeader('Location', `/transaction/${created.id}`)

      res.status(201).json({
        success: true,
        message: 'Transação de dividendo registrada com sucesso',
      });
    } catch (error: any) {
      if (error.message.includes('Nenhum portfólio encontrado')) {
        return res.status(400).json({
          success: false,
          error: 'Você precisa criar um portfólio antes de registrar transações',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const { type, quantity, price, fees } = req.body;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!type && !quantity && !price && fees === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Pelo menos um campo deve ser informado para atualização',
        });
      }

      // Valida se o type é válido (se fornecido)
      if (type && !Object.values(TransactionType).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de transação inválido. Valores válidos: ' + Object.values(TransactionType).join(', '),
        });
      }

      if ((quantity !== undefined && quantity <= 0) || (price !== undefined && price <= 0)) {
        return res.status(400).json({
          success: false,
          error: 'Quantidade e preço devem ser maiores que zero',
        });
      }

      const transaction = await TransactionService.updateTransaction(investorId, transactionId, {
        type,
        quantity,
        price,
        fees,
      });

      res.status(200).json({
        success: true,
        message: 'Transação atualizada com sucesso',
        data: transaction,
      });
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
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

  static async getTransactionsByAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { assetId } = req.params;
      const investorId = req.investor?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const result = await TransactionService.getTransactionsByAsset(investorId, assetId, page, limit);

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

  static async getTransactions(req: AuthenticatedRequest, res: Response) {
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

      const result = await TransactionService.getTransactionsByPortfolio(investorId, page, limit);

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

  static async getTransactionById(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const transaction = await TransactionService.getTransactionById(investorId, transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transação não encontrada',
        });
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}