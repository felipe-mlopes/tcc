import { Injectable } from "@nestjs/common";

import { Portfolio } from "@/domain/portfolio/entities/portfolio";
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository";
import { PrismaService } from "../prisma.service";
import { PrismaPortfolioMapper } from "../mappers/prisma-portfolio-mapper";

@Injectable()
export class PrismaPortfolioRepository implements PortfolioRepository {
    constructor(private prisma: PrismaService) {}
    
    async findById(id: string): Promise<Portfolio | null> {
        const portfolio = await this.prisma.portfolio.findUnique({
            where: { id },
        });

        if (!portfolio) {
            return null;
        }

        return PrismaPortfolioMapper.toDomain(portfolio);
    }
    
    async findByInvestorId(userId: string): Promise<Portfolio | null> {
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { investorId: userId },
        });

        if (!portfolio) {
            return null;
        }  

        return PrismaPortfolioMapper.toDomain(portfolio);
    }
    
    async create(portfolio: Portfolio): Promise<void> {
        const data = PrismaPortfolioMapper.toPrisma(portfolio);
        await this.prisma.portfolio.create({ data });
    }
    
    async update(portfolio: Portfolio): Promise<void> {
        const data = PrismaPortfolioMapper.toPrisma(portfolio);
        await this.prisma.portfolio.update({ 
            where: { 
                id: portfolio.id.toValue().toString() 
            }, 
            data 
        }); 
    }
    
}