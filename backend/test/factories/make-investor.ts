import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CPF } from "@/core/value-objects/cpf";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { Investor, InvestorProfile, InvestorProps } from "@/domain/investor/entities/investor";
import { faker } from '@faker-js/faker'

export function makeInvestor(
    override: Partial<InvestorProps> = {},
    id?: UniqueEntityID
) {
    const fakerName = Name.create(faker.person.fullName())
    const fakerEmail = Email.create(faker.internet.email())
    const fakerCpf = CPF.create('999.999.999-99')
    const fakerDate = DateOfBirth.create(faker.date.birthdate())

    const investor = Investor.create(
        {
            investorId: new UniqueEntityID(),
            name: fakerName,
            email: fakerEmail,
            cpf: fakerCpf,
            dateOfBirth: fakerDate,
            riskProfile: InvestorProfile.Conservative,
            ...override
        },
        id
    )

    return investor
}