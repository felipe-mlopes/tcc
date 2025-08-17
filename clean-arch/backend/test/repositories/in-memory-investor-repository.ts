import { Investor } from "@/domain/investor/entities/investor";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";

export class InMemoryInvestorRepository implements InvestorRepository {
    public items: Investor[] = []

    async findById(id: string): Promise<Investor | null> {
        const investor = this.items.find(item => item.id.toString() === id)

        if (!investor) return null

        return investor
    }

    async findByEmail(email: string): Promise<Investor | null> {
        const investor = this.items.find(item => item.email === email)

        if (!investor) return null

        return investor
    }

    async findByCpf(cpf: string): Promise<Investor | null> {
        const investor = this.items.find(item => item.cpf === cpf)

        if (!investor) return null

        return investor
    }

    async create(investor: Investor): Promise<void> {
        this.items.push(investor)
    }

    async update(investor: Investor): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === investor.id)

        this.items[itemIndex] = investor
    }
}