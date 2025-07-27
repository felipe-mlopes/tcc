import { PaginationParams } from "@/core/repositories/pagination-params";
import { Investment } from "@/domain/portfolio/entities/investment";
import { InvestmentRepository } from "@/domain/portfolio/repositories/investment-repository";

export class InMemoryInvestmentRepository implements InvestmentRepository {
    public items: Investment[] = []
    
    async findById(id: string): Promise<Investment | null> {
        const investment = this.items.find(
            item => item.id.toValue().toString() === id
        )
        
        if (!investment) return null
        
        return investment
    }
    
    async findByPortfolioIdAndAssetId(
        portfolioId: string, 
        assetId: string
    ): Promise<Investment | null> {
        const investment = this.items.find(
            item => item.portfolioId.toValue().toString() === portfolioId && 
            item.assetId.toValue().toString() === assetId
        )
        
        if (!investment) return null
        
        return investment
    }

    async findManyByPortfolio(
        portfolioId: string, 
        { page }: PaginationParams
    ): Promise<Investment[]> {
        const investments = this.items
            .filter(item => item.portfolioId.toValue().toString() === portfolioId)
            .sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return a.createdAt.getTime() - b.createdAt.getTime()
                }

                return a.id.toValue().toString().localeCompare(b.id.toValue().toString())
            })
            .slice((page - 1) * 20, page * 20)

        return investments
    }
    
    async findManyByPortfolioAndAsset(
        portfolioId: string, 
        assetId: string, 
        { page }: PaginationParams
    ): Promise<Investment[]> {
        const investments = this.items
            .filter(item => 
                item.portfolioId.toValue().toString() === portfolioId && 
                item.assetId.toValue().toString() === assetId
            )
            .sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return a.createdAt.getTime() - b.createdAt.getTime()
                }

                return a.id.toValue().toString().localeCompare(b.id.toValue().toString())
            })
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
        const itemIndex = this.items.findIndex(item => item.id.toValue().toString() === investimentId)
        
        this.items.splice(itemIndex, 1)
    }
}