import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvestmentService {
  constructor(private prisma: PrismaService) {}

  async create(createInvestmentDto: CreateInvestmentDto) {
    // Verificar se portfolio e asset existem
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: createInvestmentDto.portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio não encontrado');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: createInvestmentDto.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Ativo não encontrado');
    }

    try {
      return await this.prisma.investment.create({
        data: createInvestmentDto,
        include: {
          portfolio: {
            include: {
              investor: true,
            },
          },
          asset: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Investimento já existe para este ativo no portfolio',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.investment.findMany({
      include: {
        portfolio: {
          include: {
            investor: true,
          },
        },
        asset: true,
        transactions: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        portfolio: {
          include: {
            investor: true,
          },
        },
        asset: true,
        transactions: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });

    if (!investment) {
      throw new NotFoundException(`Investimento com ID ${id} não encontrado`);
    }

    return investment;
  }

  async update(id: string, updateInvestmentDto: UpdateInvestmentDto) {
    try {
      return await this.prisma.investment.update({
        where: { id },
        data: updateInvestmentDto,
        include: {
          portfolio: {
            include: {
              investor: true,
            },
          },
          asset: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Investimento com ID ${id} não encontrado`,
          );
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.investment.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Investimento com ID ${id} não encontrado`,
          );
        }
      }
      throw error;
    }
  }
}
