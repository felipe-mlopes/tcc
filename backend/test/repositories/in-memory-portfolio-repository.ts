import { Portfolio } from "@/domain/portfolio/entities/portfolio";
import { PortfolioRepository } from "@/domain/portfolio/repositories/portfolio-repository";

export class InMemoryPortfolioRepository implements PortfolioRepository {
    public items: Portfolio[] = []
    
    async findById(id: string): Promise<Portfolio | null> {
        const portfolio = this.items.find(
            item => item.id.toValue().toString() === id
        )

        if (!portfolio) return null

        return portfolio
    }

    async findByInvestorId(investorId: string): Promise<Portfolio | null> {
        const portfolio = this.items.find(
            item => item.investorId.toValue().toString() === investorId
        )

        if (!portfolio) return null

        return portfolio
    }

    async create(portfolio: Portfolio): Promise<void> {
        this.items.push(portfolio)
    }

    async update(portfolio: Portfolio): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === portfolio.id)

        this.items[itemIndex] = portfolio
    }
}