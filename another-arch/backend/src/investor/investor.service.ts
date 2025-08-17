import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { DeactivateInvestorDto } from './dto/deactivate-investor.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvestorService {
  constructor(private prisma: PrismaService) {}

  async create(createInvestorDto: CreateInvestorDto) {
    try {
      return await this.prisma.investor.create({
        data: createInvestorDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email ou CPF já cadastrado');
        }
      }
      throw error;
    }
  }

  async findAll(includeInactive = false) {
    return this.prisma.investor.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        portfolios: {
          include: {
            investments: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
      include: {
        portfolios: {
          include: {
            investments: {
              include: {
                asset: true,
                transactions: true,
              },
            },
          },
        },
      },
    });

    if (!investor) {
      throw new NotFoundException(`Investidor com ID ${id} não encontrado`);
    }

    return investor;
  }

  async update(id: string, updateInvestorDto: UpdateInvestorDto) {
    try {
      return await this.prisma.investor.update({
        where: { id },
        data: updateInvestorDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Investidor com ID ${id} não encontrado`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Email ou CPF já cadastrado');
        }
      }
      throw error;
    }
  }

  async deactivate(id: string, deactivateInvestorDto: DeactivateInvestorDto) {
    try {
      const investor = await this.prisma.investor.update({
        where: { id },
        data: {
          isActive: deactivateInvestorDto.isActive,
          updatedAt: new Date(),
        },
      });

      return {
        ...investor,
        message: deactivateInvestorDto.isActive
          ? 'Investidor ativado com sucesso'
          : 'Investidor desativado com sucesso',
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Investidor com ID ${id} não encontrado`);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      // Verificar se o investidor tem portfolios ativos
      const investor = await this.prisma.investor.findUnique({
        where: { id },
        include: {
          portfolios: {
            include: {
              investments: true,
            },
          },
        },
      });

      if (!investor) {
        throw new NotFoundException(`Investidor com ID ${id} não encontrado`);
      }

      // Se tem portfolios com investimentos, apenas desativar
      const hasActiveInvestments = investor.portfolios.some(
        (portfolio) => portfolio.investments.length > 0,
      );

      if (hasActiveInvestments) {
        return await this.deactivate(id, { isActive: false });
      }

      // Se não tem investimentos, pode remover permanentemente
      return await this.prisma.investor.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Investidor com ID ${id} não encontrado`);
        }
      }
      throw error;
    }
  }

  async findActiveInvestors() {
    return this.prisma.investor.findMany({
      where: { isActive: true },
      include: {
        portfolios: {
          include: {
            investments: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });
  }

  async findInactiveInvestors() {
    return this.prisma.investor.findMany({
      where: { isActive: false },
      include: {
        portfolios: {
          include: {
            investments: {
              include: {
                asset: true,
              },
            },
          },
        },
      },
    });
  }
}
