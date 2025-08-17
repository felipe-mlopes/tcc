import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Prisma, Investment, TransactionType } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: createTransactionDto.investmentId },
    });

    if (!investment) {
      throw new NotFoundException('Investimento não encontrado');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        executedAt: new Date(createTransactionDto.executedAt),
      },
      include: {
        investment: {
          include: {
            portfolio: {
              include: {
                investor: true,
              },
            },
            asset: true,
          },
        },
      },
    });

    // Atualizar o investimento baseado na transação
    await this.updateInvestmentAfterTransaction(transaction.investment);

    return transaction;
  }

  private async updateInvestmentAfterTransaction(investment: Investment) {
    const allTransactions = await this.prisma.transaction.findMany({
      where: { investmentId: investment.id },
      orderBy: { executedAt: 'asc' },
    });

    let totalQuantity = 0;
    let totalInvested = 0;

    for (const tx of allTransactions) {
      const quantity = Number(tx.quantity);
      const totalAmount = Number(tx.totalAmount);
      const fees = Number(tx.fees || 0);

      if (tx.type === TransactionType.BUY) {
        totalQuantity += quantity;
        totalInvested += totalAmount + fees;
      } else if (tx.type === TransactionType.SELL) {
        const sellRatio = quantity / totalQuantity;
        const soldInvestment = totalInvested * sellRatio;

        totalQuantity -= quantity;
        totalInvested -= soldInvestment;
      }
    }

    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

    await this.prisma.investment.update({
      where: { id: investment.id },
      data: {
        quantity: totalQuantity,
        averagePrice: averagePrice,
        totalInvested: totalInvested,
      },
    });
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      include: {
        investment: {
          include: {
            portfolio: {
              include: {
                investor: true,
              },
            },
            asset: true,
          },
        },
      },
      orderBy: { executedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        investment: {
          include: {
            portfolio: {
              include: {
                investor: true,
              },
            },
            asset: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transação com ID ${id} não encontrada`);
    }

    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    try {
      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: {
          ...updateTransactionDto,
          executedAt: updateTransactionDto.executedAt
            ? new Date(updateTransactionDto.executedAt)
            : undefined,
        },
        include: {
          investment: {
            include: {
              portfolio: {
                include: {
                  investor: true,
                },
              },
              asset: true,
            },
          },
        },
      });

      // Recalcular investimento após atualização
      await this.updateInvestmentAfterTransaction(transaction.investment);

      return transaction;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Transação com ID ${id} não encontrada`);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const transaction = await this.prisma.transaction.delete({
        where: { id },
        include: {
          investment: true,
        },
      });

      // Recalcular investimento após remoção
      await this.updateInvestmentAfterTransaction(transaction.investment);

      return transaction;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Transação com ID ${id} não encontrada`);
        }
      }
      throw error;
    }
  }

  async findByInvestment(investmentId: string) {
    return this.prisma.transaction.findMany({
      where: { investmentId },
      orderBy: { executedAt: 'desc' },
      include: {
        investment: {
          include: {
            asset: true,
            portfolio: {
              include: {
                investor: true,
              },
            },
          },
        },
      },
    });
  }
}
