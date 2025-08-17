import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { InvestorModule } from './investor/investor.module';
import { AssetModule } from './asset/asset.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { InvestmentModule } from './investment/investment.module';
import { TransactionModule } from './transaction/transaction.module';
import { GoalModule } from './goal/goal.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    InvestorModule,
    AssetModule,
    PortfolioModule,
    InvestmentModule,
    TransactionModule,
    GoalModule,
  ],
})
export class AppModule {}
