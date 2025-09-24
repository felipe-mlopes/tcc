import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { InvestorService } from '../servives/investorService';

export class InvestorController {
  static async register(req: Request, res: Response) {
    try {
      const { email, name, cpf, dateOfBirth, password } = req.body;

      const created = await InvestorService.createInvestor({
        email,
        name,
        cpf,
        dateOfBirth,
        password,
      });

      res.setHeader('Location', `/investor/${created.id}`)

      res.status(201).json({
        success: true,
        message: 'Investidor registrado com sucesso',
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('email')) {
          return res.status(400).json({
            success: false,
            error: 'Email já está em uso',
          });
        }
        if (error.meta?.target?.includes('cpf')) {
          return res.status(400).json({
            success: false,
            error: 'CPF já está em uso',
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async authenticate(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios',
        });
      }

      const create = await InvestorService.authenticateInvestor(email, password);

      const accessToken = create.accessToken

      res.status(200).json({
        success: true,
        message: 'Autenticação realizada com sucesso',
        accessToken

      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { email, name, password } = req.body;

      // Verifica se o ID corresponde ao investidor autenticado
      if (id !== req.investor?.id) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
        });
      }

      if (!email && !name && !password) {
        return res.status(400).json({
          success: false,
          error: 'Pelo menos um campo deve ser informado para atualização',
        });
      }

      await InvestorService.updateInvestor(id, {
        email,
        name,
        password,
      });

      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(400).json({
          success: false,
          error: 'Email já está em uso',
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Investidor não encontrado',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async deactivateAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verifica se o ID corresponde ao investidor autenticado
      if (id !== req.investor?.id) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado',
        });
      }

      await InvestorService.deactivateInvestor(id);

      res.status(200).json({
        success: true
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Investidor não encontrado',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const investor = await InvestorService.getInvestorById(investorId);

      if (!investor) {
        return res.status(404).json({
          success: false,
          error: 'Investidor não encontrado',
        });
      }

      res.status(200).json({
        success: true,
        data: investor,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}