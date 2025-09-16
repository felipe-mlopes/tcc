import { PrismaClient, Priority, Status } from '@prisma/client';

const prisma = new PrismaClient();

export class GoalService {
  static async createGoal(investorId: string, data: {
    name: string;
    description?: string;
    targetAmount: number;
    targetDate: string;
    priority: Priority;
  }) {
    const goal = await prisma.goal.create({
      data: {
        investorId,
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        targetDate: new Date(data.targetDate),
        priority: data.priority,
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return goal;
  }

  static async updateGoal(investorId: string, goalId: string, data: {
    name?: string;
    description?: string;
    targetAmount?: number;
    targetDate?: string;
    priority?: Priority;
    status?: Status;
  }) {
    // Verifica se a meta pertence ao investidor
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existingGoal || existingGoal.investorId !== investorId) {
      throw new Error('Meta não encontrada');
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.targetAmount) updateData.targetAmount = data.targetAmount;
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return goal;
  }

  static async getGoalById(investorId: string, goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: {
        id: goalId,
        investorId,
      },
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return goal;
  }

  static async getGoalsByInvestor(investorId: string, status?: Status, priority?: Priority) {
    const whereClause: any = { investorId };

    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;

    const goals = await prisma.goal.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return goals;
  }

  static async deleteGoal(investorId: string, goalId: string) {
    // Verifica se a meta pertence ao investidor
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existingGoal || existingGoal.investorId !== investorId) {
      throw new Error('Meta não encontrada');
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { message: 'Meta excluída com sucesso' };
  }

  static async getGoalsProgress(investorId: string) {
    const goals = await prisma.goal.findMany({
      where: { 
        investorId,
        status: Status.Active,
      },
      orderBy: { targetDate: 'asc' },
    });

    // Calcula o progresso baseado no valor atual do portfolio
    const portfolios = await prisma.portfolio.findMany({
      where: { investorId },
      include: {
        investments: {
          select: {
            totalValue: true,
          },
        },
      },
    });

    const totalPortfolioValue = portfolios.reduce((total, portfolio) => {
      const portfolioValue = portfolio.investments.reduce((sum, investment) => {
        return sum + Number(investment.totalValue);
      }, 0);
      return total + portfolioValue;
    }, 0);

    const goalsWithProgress = goals.map(goal => {
      const progress = (totalPortfolioValue / Number(goal.targetAmount)) * 100;
      const remainingAmount = Number(goal.targetAmount) - totalPortfolioValue;
      const daysUntilTarget = Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...goal,
        currentValue: totalPortfolioValue,
        progress: Math.min(progress, 100),
        remainingAmount: Math.max(remainingAmount, 0),
        daysUntilTarget,
        isOverdue: daysUntilTarget < 0,
      };
    });

    return goalsWithProgress;
  }

  static async markGoalAsAchieved(investorId: string, goalId: string) {
    return await this.updateGoal(investorId, goalId, { status: Status.Achieved });
  }

  static async markGoalAsCancelled(investorId: string, goalId: string) {
    return await this.updateGoal(investorId, goalId, { status: Status.Cancelled });
  }
}