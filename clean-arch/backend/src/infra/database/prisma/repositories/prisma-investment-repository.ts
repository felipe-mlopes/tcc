import { Injectable } from "@nestjs/common";

import { PaginationParams } from "@/core/repositories/pagination-params";
import { InvestmentRepository } from "@/domain/portfolio/repositories/investment-repository";
import { Investment } from "@/domain/portfolio/entities/investment";
import { PrismaService } from "../prisma.service";
import { PrismaInvestmentMapper } from "../mappers/prisma-investment-mapper";

@Injectable()
export class PrismaInvestmentRepository implements InvestmentRepository {
    constructor(private prisma: PrismaService) {}
    
    async findById(id: string): Promise<Investment | null> {
        const investment = await this.prisma.investment.findUnique({
            where: { id },
        });

        if (!investment) {
            return null;
        }

        return PrismaInvestmentMapper.toDomain(investment); 
    }

    async findByPortfolioIdAndAssetId(portfolioId: string, assetId: string): Promise<Investment | null> {
        const investment = await this.prisma.investment.findFirst({
            where: { portfolioId, assetId },
        });

        if (!investment) {
            return null;
        }

        return PrismaInvestmentMapper.toDomain(investment);
    }

    async findManyByPortfolio(portfolioId: string, params: PaginationParams): Promise<Investment[]> {
        const investments = await this.prisma.investment.findMany({
            where: { portfolioId },
            take: 20,
            skip: (params.page - 1) * 20,
        });

        return investments.map(PrismaInvestmentMapper.toDomain);
    }

    async create(investiment: Investment): Promise<void> {
        const data = PrismaInvestmentMapper.toPrisma(investiment);
        await this.prisma.investment.create({ data });   
    }

    async update(investiment: Investment): Promise<void> {
        const data = PrismaInvestmentMapper.toPrisma(investiment);
        await this.prisma.investment.update({ 
            where: { id: investiment.id.toValue().toString() }, 
            data 
        });
    }

    async delete(investimentId: string): Promise<void> {
        await this.prisma.investment.delete({
            where: { id: investimentId }
        });
    }

}