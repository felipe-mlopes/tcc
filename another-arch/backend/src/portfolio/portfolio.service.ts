import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async create(createPortfolioDto: CreatePortfolioDto) {
    const investor = await this.prisma.investor.findUnique({
      where: { id: createPortfolioDto.investorId },
    });

    if (!investor) {
      throw new NotFoundException('Investidor não encontrado');
    }

    return this.prisma.portfolio.create({
      data: createPortfolioDto,
      include: {
        investor: true,
        investments: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.portfolio.findMany({
      include: {
        investor: true,
        investments: {
          include: {
            asset: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id },
      include: {
        investor: true,
        investments: {
          include: {
            asset: true,
            transactions: {
              orderBy: { executedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio com ID ${id} não encontrado`);
    }

    return portfolio;
  }

  async getPortfolioSummary(id: string) {
    const portfolio = await this.findOne(id);

    const summary = {
      totalInvested: portfolio.investments.reduce(
        (sum, inv) => sum + Number(inv.totalInvested),
        0,
      ),
      totalAssets: portfolio.investments.length,
      assetDistribution: portfolio.investments.map((inv) => ({
        asset: inv.asset.symbol,
        quantity: Number(inv.quantity),
        totalInvested: Number(inv.totalInvested),
        averagePrice: Number(inv.averagePrice),
      })),
    };

    return {
      ...portfolio,
      summary,
    };
  }
}
