import { Investor, InvestorProfile } from "../entities/investor";
import { Either, left, right } from "@/core/either";

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { InvestorRepository } from "../repositories/investor-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { CPF } from "@/core/value-objects/cpf";

interface RegisterInvestorServiceRequest {
    email: string
    name: string
    cpf: string
    dateOfBirth: Date
}

type RegisterInvestorServiceResponse = Either<NotAllowedError, {
    newInvestor: Investor
}>

export class RegisterInvestorService {
    constructor(private investorRepository: InvestorRepository) {}

    public async execute({
        email,
        name,
        cpf,
        dateOfBirth
    }: RegisterInvestorServiceRequest): Promise<RegisterInvestorServiceResponse> {
        const emailInvestorVerified = await this.investorRepository.findByEmail(email)
        const cpfInvestorVerified = await this.investorRepository.findByCpf(cpf)

        if (emailInvestorVerified || cpfInvestorVerified) return left(new NotAllowedError(
            'Email or CPF is already in use.'
        ))
        if (!DateOfBirth.isValid(dateOfBirth)) return left(new NotAllowedError(
            'Invalid date of birth.'
        ))
        
        const age = DateOfBirth.calculateAge(dateOfBirth) 
        const riskProfile = await this.getRiskProfileSuggestion(age)

        const newInvestor = Investor.create({
            email: Email.create(email),
            name: Name.create(name),
            cpf: CPF.create(cpf),
            dateOfBirth: DateOfBirth.create(dateOfBirth),
            riskProfile
        })

        await this.investorRepository.create(newInvestor)

        return right({
            newInvestor
        })
    }
    
    private async getRiskProfileSuggestion(
        userAge: number
    ): Promise<InvestorProfile> {
        if (userAge < 25) return InvestorProfile.Aggressive

        if (userAge >= 25 && userAge < 50) return InvestorProfile.Conservative

        return InvestorProfile.Moderate
    }
}