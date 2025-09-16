import { Investor, InvestorProfile } from "../entities/investor";
import { Either, left, right } from "@/shared/exceptions/either";

import { InvestorRepository } from "../repositories/investor-repository";
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { CPF } from "@/core/value-objects/cpf";
import { Injectable } from "@nestjs/common";
import { HashGenerator } from "../cryptography/hash-generator";
import { Password } from "@/core/value-objects/password";

interface RegisterInvestorServiceRequest {
    email: string
    name: string
    cpf: string
    password: string
    dateOfBirth: Date
}

type RegisterInvestorServiceResponse = Either<NotAllowedError, {
    message: string
}>

@Injectable()
export class RegisterInvestorService {
    constructor(
        readonly investorRepository: InvestorRepository,
        readonly hashGenerator: HashGenerator
    ) {}

    public async execute({
        email,
        name,
        cpf,
        password,
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

        const passwordFormatted = Password.create(password)
        const hashedPassword = await this.hashGenerator.hash(passwordFormatted.getValue())
        
        const parsedDate = new Date(dateOfBirth)

        if (!(parsedDate instanceof Date) || isNaN(parsedDate.getTime())) {
            return left(new NotAllowedError('Invalid date of birth.'))
        }

        if (!DateOfBirth.isValid(parsedDate)) {
            return left(new NotAllowedError('Invalid date of birth.'))
        }

        const age = DateOfBirth.calculateAge(parsedDate) 
        
        const riskProfile = await this.getRiskProfileSuggestion(age)

        const newInvestor = Investor.create({
            email: Email.create(email),
            name: Name.create(name),
            cpf: CPF.create(cpf),
            password: Password.create(hashedPassword),
            dateOfBirth: DateOfBirth.create(parsedDate),
            riskProfile
        })

        await this.investorRepository.create(newInvestor)

        return right({
            message: 'O cadastro de investidor foi realizado com sucesso'
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