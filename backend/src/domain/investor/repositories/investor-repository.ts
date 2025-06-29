import { Investor } from "../entities/investor";

export interface InvestorRepository {
    findById(id: string): Promise<Investor | null>
    findByEmail(email: string): Promise<Investor | null>
    findByCpf(cpf: string): Promise<Investor | null>
    create(investor: Investor): Promise<void>
    update(investor: Investor): Promise<void>
}