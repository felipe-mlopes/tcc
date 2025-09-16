import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Priority, Status } from '@prisma/client';
import { GoalService } from '../servives/goalService';

export class GoalController {
  static async createGoal(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, targetAmount, targetDate, priority } = req.body;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!name || !targetAmount || !targetDate || !priority) {
        return res.status(400).json({
          success: false,
          error: 'Name, targetAmount, targetDate e priority são obrigatórios',
        });
      }

      if (targetAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor da meta deve ser maior que zero',
        });
      }

      if (new Date(targetDate) <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data da meta deve ser futura',
        });
      }

      // Valida se a prioridade é válida
      if (!Object.values(Priority).includes(priority)) {
        return res.status(400).json({
          success: false,
          error: 'Prioridade inválida. Valores válidos: ' + Object.values(Priority).join(', '),
        });
      }

      await GoalService.createGoal(investorId, {
        name,
        description,
        targetAmount,
        targetDate,
        priority,
      });

      res.status(201).json({
        success: true,
        message: 'Meta criada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async updateGoal(req: AuthenticatedRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const { name, description, targetAmount, targetDate, priority, status } = req.body;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      if (!name && !description && !targetAmount && !targetDate && !priority && !status) {
        return res.status(400).json({
          success: false,
          error: 'Pelo menos um campo deve ser informado para atualização',
        });
      }

      if (targetAmount !== undefined && targetAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valor da meta deve ser maior que zero',
        });
      }

      if (targetDate && new Date(targetDate) <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Data da meta deve ser futura',
        });
      }

      // Valida se a prioridade é válida (se fornecida)
      if (priority && !Object.values(Priority).includes(priority)) {
        return res.status(400).json({
          success: false,
          error: 'Prioridade inválida. Valores válidos: ' + Object.values(Priority).join(', '),
        });
      }

      // Valida se o status é válido (se fornecido)
      if (status && !Object.values(Status).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido. Valores válidos: ' + Object.values(Status).join(', '),
        });
      }

      await GoalService.updateGoal(investorId, goalId, {
        name,
        description,
        targetAmount,
        targetDate,
        priority,
        status,
      });

      res.status(200).json({
        success: true,
        message: 'Meta atualizada com sucesso'
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

  static async getGoalById(req: AuthenticatedRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const goal = await GoalService.getGoalById(investorId, goalId);

      if (!goal) {
        return res.status(404).json({
          success: false,
          error: 'Meta não encontrada',
        });
      }

      res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async getGoals(req: AuthenticatedRequest, res: Response) {
    try {
      const investorId = req.investor?.id;
      const { status, priority } = req.query;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      // Valida filtros se fornecidos
      if (status && !Object.values(Status).includes(status as Status)) {
        return res.status(400).json({
          success: false,
          error: 'Status inválido. Valores válidos: ' + Object.values(Status).join(', '),
        });
      }

      if (priority && !Object.values(Priority).includes(priority as Priority)) {
        return res.status(400).json({
          success: false,
          error: 'Prioridade inválida. Valores válidos: ' + Object.values(Priority).join(', '),
        });
      }

      const goals = await GoalService.getGoalsByInvestor(
        investorId,
        status as Status,
        priority as Priority
      );

      res.status(200).json({
        success: true,
        data: goals,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async deleteGoal(req: AuthenticatedRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      await GoalService.deleteGoal(investorId, goalId);

      res.status(200).json({
        success: true
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

  static async getGoalsProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      const goalsProgress = await GoalService.getGoalsProgress(investorId);

      res.status(200).json({
        success: true,
        data: goalsProgress,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  static async markGoalAsAchieved(req: AuthenticatedRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      await GoalService.markGoalAsAchieved(investorId, goalId);

      res.status(200).json({
        success: true,
        message: 'Meta marcada como alcançada',
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

  static async markGoalAsCancelled(req: AuthenticatedRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const investorId = req.investor?.id;

      if (!investorId) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido',
        });
      }

      await GoalService.markGoalAsCancelled(investorId, goalId);

      res.status(200).json({
        success: true,
        message: 'Meta marcada como cancelada'
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
}