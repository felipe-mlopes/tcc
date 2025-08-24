import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { PrismaInvestorRepository } from "./prisma/repositories/prisma-investor-repository";
import { AssetRepository } from "@/domain/asset/repositories/asset-repository";
import { PrismaAssetRepository } from "./prisma/repositories/prisma-asset-repository";
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository";
import { PrismaPortfolioRepository } from "./prisma/repositories/prisma-portfolio-repository";
import { InvestmentRepository } from "@/domain/portfolio/repositories/investment-repository";
import { PrismaInvestmentRepository } from "./prisma/repositories/prisma-investment-repository";
import { TransactionRepository } from "@/domain/transaction/repositories/transaction-repository";
import { PrismaTransactionRepository } from "./prisma/repositories/prisma-transaction-repository";
import { GoalRepository } from "@/domain/goal/repositories/goal-repository";
import { PrismaGoalRepository } from "./prisma/repositories/prisma-goal-repository";

@Module({
    imports: [],
    providers: [
        PrismaService,
        {
            provide: InvestorRepository,
            useClass: PrismaInvestorRepository
        },
        {
            provide: AssetRepository,
            useClass: PrismaAssetRepository
        },
        {
            provide: PortfolioRepository,
            useClass: PrismaPortfolioRepository
        },
        {
            provide: InvestmentRepository,
            useClass: PrismaInvestmentRepository
        },
        {
            provide: TransactionRepository,
            useClass: PrismaTransactionRepository
        },
        {
            provide: GoalRepository,
            useClass: PrismaGoalRepository
        }

    ],
    exports: [
        PrismaService,
        InvestorRepository,
        AssetRepository,
        PortfolioRepository,
        InvestmentRepository,
        TransactionRepository,
        GoalRepository
    ],
})
export class DatabaseModule {}