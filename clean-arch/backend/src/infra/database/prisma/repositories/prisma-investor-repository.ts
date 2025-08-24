import { Investor } from "@/domain/investor/entities/investor";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { PrismaInvestorMapper } from "../mappers/prisma-investor-mapper";

@Injectable()
export class PrismaInvestorRepository implements InvestorRepository {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<Investor | null> {
        const investor = await this.prisma.investor.findUnique({
            where: { id },
        });

        if (!investor) {
            return null;
        }

        return PrismaInvestorMapper.toDomain(investor);
    }

    async findByEmail(email: string): Promise<Investor | null> {
        const investor = await this.prisma.investor.findUnique({
            where: { email },
        });

        if (!investor) {
            return null;
        }

        return PrismaInvestorMapper.toDomain(investor);
    }
    async findByCpf(cpf: string): Promise<Investor | null> {
        const investor = await this.prisma.investor.findUnique({
            where: { cpf },
        });

        if (!investor) {
            return null;
        }

        return PrismaInvestorMapper.toDomain(investor);
        
    }
    
    async create(investor: Investor): Promise<void> {
        const data = PrismaInvestorMapper.toPrisma(investor);
        await this.prisma.investor.create({ data });
    }

    async update(investor: Investor): Promise<void> {
        const data = PrismaInvestorMapper.toPrisma(investor);
        await this.prisma.investor.update({ 
            where: { 
                id: investor.id.toValue().toString() 
            }, 
            data 
        });   
    }

}