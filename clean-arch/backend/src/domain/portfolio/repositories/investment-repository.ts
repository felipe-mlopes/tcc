import { PaginationParams } from "@/core/repositories/pagination-params"
import { Investment } from "../entities/investment"

export abstract class InvestmentRepository {
    abstract findById(id: string): Promise<Investment | null>
    abstract findByPortfolioIdAndAssetId(
        portfolioId: string, 
        assetId: string
    ): Promise<Investment | null>
    abstract findManyByPortfolio(
        portfolioId: string,
        params: PaginationParams 
    ): Promise<Investment[]>
    abstract create(investiment: Investment): Promise<void>
    abstract update(investiment: Investment): Promise<void>
    abstract delete(investimentId: string): Promise<void>
}