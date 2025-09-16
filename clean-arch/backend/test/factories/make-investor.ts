import { Injectable } from "@nestjs/common";
import { Faker, faker, pt_BR } from '@faker-js/faker'

import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CPF } from "@/core/value-objects/cpf";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Email } from "@/core/value-objects/email";
import { Name } from "@/core/value-objects/name";
import { Password } from "@/core/value-objects/password";

import { Investor, InvestorProfile, InvestorProps } from "@/domain/investor/entities/investor";

import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { PrismaInvestorMapper } from "@/infra/database/prisma/mappers/prisma-investor-mapper";
import { generateCPF } from "test/utils/gerenate-cpf";

export const customFaker = new Faker({
    locale: [pt_BR]
})

export function makeInvestor(
    override: Partial<InvestorProps> = {},
    id?: UniqueEntityID
) {
    const cpf = generateCPF()

    const fakerName = Name.create(faker.person.fullName())
    const fakerEmail = Email.create(faker.internet.email())
    const fakerCpf = CPF.create(cpf)
    const fakerpassword = Password.create(faker.internet.password({ prefix: '@Pass123' }))
    const fakerDate = DateOfBirth.create(faker.date.birthdate())

    const investor = Investor.create(
        {
            name: fakerName,
            email: fakerEmail,
            cpf: fakerCpf,
            password: fakerpassword,
            dateOfBirth: fakerDate,
            riskProfile: InvestorProfile.Conservative,
            ...override
        },
        id
    )

    return investor
}

@Injectable()
export class InvestorFactory {
    constructor(readonly prisma: PrismaService) {}

    async makePrismaInvestor(data: Partial<InvestorProps> = {}): Promise<Investor> {
        const investor = makeInvestor(data)

        await this.prisma.investor.create({
            data: PrismaInvestorMapper.toPrisma(investor)
        })

        return investor
    }
}