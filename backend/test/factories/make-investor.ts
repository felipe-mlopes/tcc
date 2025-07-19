import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CPF } from "@/core/value-objects/cpf";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { Investor, InvestorProfile, InvestorProps } from "@/domain/investor/entities/investor";
import { Faker, faker, pt_BR } from '@faker-js/faker'

export const customFaker = new Faker({
    locale: [pt_BR]
})

export function makeInvestor(
    override: Partial<InvestorProps> = {},
    id?: UniqueEntityID
) {
    const fakerName = Name.create(faker.person.fullName())
    const fakerEmail = Email.create(faker.internet.email())
    const fakerCpf = CPF.create("111.444.689-35")
    const fakerDate = DateOfBirth.create(faker.date.birthdate())

    const investor = Investor.create(
        {
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