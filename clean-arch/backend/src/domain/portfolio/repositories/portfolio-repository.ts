import { Portfolio } from "../entities/portfolio"

export abstract class PortfolioRepository {
    abstract findById(id: string): Promise<Portfolio | null>
    abstract findByInvestorId(userId: string): Promise<Portfolio | null>
    abstract create(portfolio: Portfolio): Promise<void>
    abstract update(portfolio: Portfolio): Promise<void>
}