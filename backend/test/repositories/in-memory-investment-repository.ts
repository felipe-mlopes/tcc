import { PaginationParams } from "@/core/repositories/pagination-params";
import { Investment } from "@/domain/portfolio/entities/investment";
import { InvestmentRepository } from "@/domain/portfolio/repositories/investment-repository";

export class InMemoryInvestmentRepository implements InvestmentRepository {
    public items: Investment[] = []
    
    async findById(id: string): Promise<Investment | null> {
        const investment = this.items.find(
            item => item.id.toString() === id
        )

        if (!investment) return null

        return investment
    }

    async findManyByPortfolioAndAsset(
        portfolioId: string, 
        assetId: string, 
        { page }: PaginationParams
    ): Promise<Investment[]> {
        const investments = this.items
            .filter(item => item.portfolioId.toString() === portfolioId && item.assetId.toString() === assetId)
            .slice((page - 1) * 20, page * 20)

        return investments
    }

    async create(investiment: Investment): Promise<void> {
        this.items.push(investiment)
    }
    
    async update(investiment: Investment): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === investiment.id)

        this.items[itemIndex] = investiment
    }

    async delete(investimentId: string): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id.toString() === investimentId)
        
        this.items.splice(itemIndex, 1)
    }
}