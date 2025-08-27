import { Investor as PrismaInvestor, Prisma } from "@prisma/client";
import { Investor } from "@/domain/investor/entities/investor";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Name } from "@/core/value-objects/name";
import { Email } from "@/core/value-objects/email";
import { CPF } from "@/core/value-objects/cpf";
import { DateOfBirth } from "@/core/value-objects/date-of-birth";
import { Password } from "@/core/value-objects/password";

export class PrismaInvestorMapper {
    static toDomain(raw: PrismaInvestor): Investor {
        return Investor.create(
            {
                name: Name.create(raw.name),
                email: Email.create(raw.email),
                cpf: CPF.create(raw.cpf),
                password: Password.create(raw.password),
                dateOfBirth: DateOfBirth.create(raw.dateOfBirth),
                riskProfile: raw.riskProfile as Investor["riskProfile"],
            },
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(investor: Investor): Prisma.InvestorCreateInput {
        return {
            id: investor.id.toValue().toString(),
            name: investor.name,
            email: investor.email,
            cpf: investor.cpf,
            password: investor.password,
            dateOfBirth: investor.dateOfBirth,
            riskProfile: investor.riskProfile as Prisma.InvestorCreateInput["riskProfile"],
            isActive: investor.isActive,
            createdAt: investor.createdAt,
            updatedAt: investor.updatedAt
        };
    }
}