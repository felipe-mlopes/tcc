import { PaginationParams } from "@/core/repositories/pagination-params"
import { Investment } from "../entities/investment"

export interface InvestmentRepository {
    findById(id: string): Promise<Investment | null>
    findManyByPortfolioAndAsset(
        portfolioId: string, 
        assetId: string, 
        params: PaginationParams
    ): Promise<Investment[]>
    create(investiment: Investment): Promise<void>
    update(investiment: Investment): Promise<void>
    delete(investimentId: string): Promise<void>
}