import { Portfolio } from "../entities/portfolio"

export interface PortfolioRepository {
    findById(id: string): Promise<Portfolio | null>
    findByUserId(userId: string): Promise<Portfolio | null>
    create(portfolio: Portfolio): Promise<void>
    update(portfolio: Portfolio): Promise<void>
    delete(portfolio: Portfolio): Promise<void>
}