import { Portfolio } from "../entities/portfolio"

export interface PortfolioRepository {
    findById(id: string): Promise<Portfolio | null>
    findByInvestorId(userId: string): Promise<Portfolio | null>
    create(portfolio: Portfolio): Promise<void>
    update(portfolio: Portfolio): Promise<void>
}