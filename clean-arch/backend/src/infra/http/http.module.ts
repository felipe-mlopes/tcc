import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { CryptographyModule } from "../cryptography/cryptography.module";
import { RegisterInvestorController } from "./controller/investor/register-investor.controller";
import { UpdateInvestorController } from "./controller/investor/update-investor.controller";
import { DeactivateInvestorController } from "./controller/investor/deactivate-investor.controller";
import { RegisterAssetController } from "./controller/asset/register-asset.controller";
import { CreatePortfolioController } from "./controller/portfolio/create-portfolio.controller";
import { AddInvestmentToPortfolioController } from "./controller/portfolio/add-investment-to-portfolio.controller";
import { GetInvestmentByAssetIdController } from "./controller/portfolio/get-investment-by-asset-id.controller";
import { FetchAllInvestmentsByPortfolioIdController } from "./controller/portfolio/fetch-all-investments-by-portfolio-id.controller";
import { RecordBuyTransactionController } from "./controller/transaction/record-buy-transaction.controller";
import { RecordSellTransactionController } from "./controller/transaction/record-sell-transaction.controller";
import { RecordDividendTransactionController } from "./controller/transaction/record-dividend-transaction.controller";
import { FetchTransactionsHistoryByAssetIdController } from "./controller/transaction/fetch-transactions-history-by-asset-id.controller";
import { FetchTransactionsHistoryByPortfolioIdController } from "./controller/transaction/fetch-transactions-history-by-portfolio-id.controller";
import { UpdateInvestmentAfterTransactionController } from "./controller/portfolio/update-investment-after-transaction.controller";
import { UpdateTransactionController } from "./controller/transaction/update-transaction.controller";
import { RegisterInvestmentGoalController } from "./controller/goal/register-investment-goal.controller";
import { UpdateInvestmentGoalController } from "./controller/goal/update-investment-goal.controller";

import { RegisterInvestorService } from "@/domain/investor/services/register-investor";
import { UpdateInvestorService } from "@/domain/investor/services/update-investor";
import { DeactivateInvestorService } from "@/domain/investor/services/deactivate-investor";
import { RegisterAssetService } from "@/domain/asset/services/register-asset";
import { CreatePortfolioService } from "@/domain/portfolio/services/create-portfolio";
import { AddInvestmentToPortfolioService } from "@/domain/portfolio/services/add-investment-to-portfolio";
import { GetInvestmentByAssetIdService } from "@/domain/portfolio/services/get-investment-by-asset-id";
import { FetchAllInvestmentsByPortfolioIdService } from "@/domain/portfolio/services/fetch-all-investments-by-portfolio-id";
import { RecordBuyTransactionService } from "@/domain/transaction/services/record-buy-transaction";
import { RecordSellTransactionService } from "@/domain/transaction/services/record-sell-transaction";
import { RecordDividendTransactionService } from "@/domain/transaction/services/record-dividend-transaction";
import { UpdateTransactionService } from "@/domain/transaction/services/update-transaction";
import { FetchTransactionsHistoryByAssetIdService } from "@/domain/transaction/services/fetch-transactions-history-by-asset-id";
import { FetchTransactionsHistoryByPorfolioIdService } from "@/domain/transaction/services/fetch-transactions-history-by-portfolio-id";
import { TransactionValidatorService } from "@/domain/transaction/services/transaction-validator";
import { RegisterInvestmentGoalService } from "@/domain/goal/services/register-investment-goal";
import { UpdateInvestmentGoalService } from "@/domain/goal/services/update-investment-goal";
import { UpdateInvestmentAfterTransactionService } from "@/domain/portfolio/services/update-investment-after-transaction";
import { AuthenticateInvestorController } from "./controller/investor/authenticate-investor.controller";
import { AuthenticateInvestorService } from "@/domain/investor/services/authenticate-investor";

@Module({
    imports: [DatabaseModule, CryptographyModule],
    controllers: [
        RegisterInvestorController,
        AuthenticateInvestorController,
        UpdateInvestorController,
        DeactivateInvestorController,
        RegisterAssetController,
        CreatePortfolioController,
        AddInvestmentToPortfolioController,
        UpdateInvestmentAfterTransactionController,
        GetInvestmentByAssetIdController,
        FetchAllInvestmentsByPortfolioIdController,
        RecordBuyTransactionController,
        RecordSellTransactionController,
        RecordDividendTransactionController,
        UpdateTransactionController,
        FetchTransactionsHistoryByAssetIdController,
        FetchTransactionsHistoryByPortfolioIdController,
        RegisterInvestmentGoalController,
        UpdateInvestmentGoalController
    ],
    providers: [
        RegisterInvestorService,
        AuthenticateInvestorService,
        UpdateInvestorService,
        DeactivateInvestorService,
        RegisterAssetService,
        CreatePortfolioService,
        AddInvestmentToPortfolioService,
        UpdateInvestmentAfterTransactionService,
        GetInvestmentByAssetIdService,
        FetchAllInvestmentsByPortfolioIdService,
        RecordBuyTransactionService,
        RecordSellTransactionService,
        RecordDividendTransactionService,
        UpdateTransactionService,
        FetchTransactionsHistoryByAssetIdService,
        FetchTransactionsHistoryByPorfolioIdService,
        TransactionValidatorService,
        RegisterInvestmentGoalService,
        UpdateInvestmentGoalService
    ]
})
export class HttpModule {}