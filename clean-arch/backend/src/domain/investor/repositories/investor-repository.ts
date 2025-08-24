import { Investor } from "../entities/investor";

export abstract class InvestorRepository {
    abstract findById(id: string): Promise<Investor | null>
    abstract findByEmail(email: string): Promise<Investor | null>
    abstract findByCpf(cpf: string): Promise<Investor | null>
    abstract create(investor: Investor): Promise<void>
    abstract update(investor: Investor): Promise<void>
}