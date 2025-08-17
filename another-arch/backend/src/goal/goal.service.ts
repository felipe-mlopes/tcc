import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { UpdateGoalProgressDto } from './dto/update-goal-progress.dto';
import { Goal, Prisma } from '@prisma/client';

@Injectable()
export class GoalService {
  constructor(private prisma: PrismaService) {}

  async create(createGoalDto: CreateGoalDto) {
    try {
      const { targetAmount, targetDate, investorId, ...rest } = createGoalDto;

      // Verificar se o investidor existe
      const investor = await this.prisma.investor.findUnique({
        where: { id: investorId },
      });

      if (!investor) {
        throw new NotFoundException('Investidor não encontrado');
      }

      // Verificar se a data target é futura
      if (new Date(targetDate) <= new Date()) {
        throw new BadRequestException('Data alvo deve ser futura');
      }

      const goal = await this.prisma.goal.create({
        data: {
          ...rest,
          targetAmount,
          targetDate: new Date(targetDate),
          investorId,
        },
      });

      return this.enrichGoalData(goal);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new NotFoundException('Investidor não encontrado');
        }
      }
      throw error;
    }
  }

  async findAll(investorId?: string) {
    return this.prisma.goal.findMany({
      where: investorId ? { investorId } : undefined,
      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isAchieved: 'asc' },
        { priority: 'desc' },
        { targetDate: 'asc' },
      ],
    });
  }

  async findOne(id: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
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

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.enrichGoalData(goal);
  }

  async update(id: string, updateGoalDto: UpdateGoalDto) {
    try {
      const existingGoal = await this.prisma.goal.findUnique({
        where: { id },
      });

      if (!existingGoal) {
        throw new NotFoundException('Meta não encontrada');
      }

      if (existingGoal.isAchieved) {
        throw new BadRequestException(
          'Não é possível editar meta já alcançada',
        );
      }

      const { targetDate, ...rest } = updateGoalDto;

      // Verificar se a nova data target é futura
      if (targetDate && new Date(targetDate) <= new Date()) {
        throw new BadRequestException('Data alvo deve ser futura');
      }

      const updatedGoal = await this.prisma.goal.update({
        where: { id },
        data: {
          ...rest,
          ...(targetDate && { targetDate: new Date(targetDate) }),
        },
      });

      return this.enrichGoalData(updatedGoal);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Meta não encontrada');
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.goal.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Meta não encontrada');
        }
      }
      throw error;
    }
  }

  async updateProgress(id: string, updateProgressDto: UpdateGoalProgressDto) {
    try {
      const existingGoal = await this.prisma.goal.findUnique({
        where: { id },
      });

      if (!existingGoal) {
        throw new NotFoundException('Meta não encontrada');
      }

      const { currentAmount } = updateProgressDto;
      const targetAmount = Number(existingGoal.targetAmount);
      const isAchieved = currentAmount >= targetAmount;

      const updatedGoal = await this.prisma.goal.update({
        where: { id },
        data: {
          currentAmount,
          isAchieved,
          ...(isAchieved && { updatedAt: new Date() }),
        },
      });

      return this.enrichGoalData(updatedGoal);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Meta não encontrada');
        }
      }
      throw error;
    }
  }

  async markAsAchieved(id: string) {
    try {
      const existingGoal = await this.prisma.goal.findUnique({
        where: { id },
      });

      if (!existingGoal) {
        throw new NotFoundException('Meta não encontrada');
      }

      if (existingGoal.isAchieved) {
        throw new BadRequestException('Meta já foi alcançada');
      }

      const updatedGoal = await this.prisma.goal.update({
        where: { id },
        data: {
          isAchieved: true,
          currentAmount: existingGoal.targetAmount,
        },
      });

      return {
        ...this.enrichGoalData(updatedGoal),
        message: 'Meta marcada como alcançada com sucesso',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Meta não encontrada');
        }
      }
      throw error;
    }
  }

  async calculateGoalProjection(id: string, monthlyContribution: number) {
    const goal = await this.findOne(id);

    if (goal.isAchieved) {
      throw new BadRequestException('Meta já foi alcançada');
    }

    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);
    const remainingAmount = targetAmount - currentAmount;

    if (monthlyContribution <= 0) {
      throw new BadRequestException('Contribuição mensal deve ser positiva');
    }

    // Calcular meses necessários para completar com a contribuição atual
    const monthsToComplete = Math.ceil(remainingAmount / monthlyContribution);

    // Data projetada de conclusão
    const projectedCompletionDate = new Date();
    projectedCompletionDate.setMonth(
      projectedCompletionDate.getMonth() + monthsToComplete,
    );

    // Verificar se é possível atingir até a data target
    const targetDate = new Date(goal.targetDate);
    const monthsUntilTarget = Math.ceil(
      (targetDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );

    const isAchievableByTargetDate = monthsToComplete <= monthsUntilTarget;

    // Contribuição mensal recomendada para atingir na data target
    const recommendedMonthlyContribution =
      monthsUntilTarget > 0
        ? remainingAmount / monthsUntilTarget
        : remainingAmount;

    return {
      goal,
      projection: {
        projectedCompletionDate,
        monthsToComplete,
        totalContributionsNeeded: Math.ceil(
          remainingAmount / monthlyContribution,
        ),
        isAchievableByTargetDate,
        recommendedMonthlyContribution: Math.max(
          0,
          recommendedMonthlyContribution,
        ),
      },
    };
  }

  private enrichGoalData(goal: Goal) {
    const currentAmount = Number(goal.currentAmount);
    const targetAmount = Number(goal.targetAmount);
    const now = new Date();
    const targetDate = new Date(goal.targetDate);

    // Calcular progresso percentual
    const progressPercentage = Math.min(
      (currentAmount / targetAmount) * 100,
      100,
    );

    // Valor restante
    const remainingAmount = Math.max(targetAmount - currentAmount, 0);

    // Dias restantes
    const timeDiff = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Contribuição mensal necessária
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    const monthlyRequiredContribution =
      monthsRemaining > 0 && remainingAmount > 0
        ? remainingAmount / monthsRemaining
        : 0;

    return {
      ...goal,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      remainingAmount,
      daysRemaining: Math.max(daysRemaining, 0),
      monthlyRequiredContribution: Math.max(monthlyRequiredContribution, 0),
    };
  }
}
