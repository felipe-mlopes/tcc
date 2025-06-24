import { Either, left, right } from "@/core/either"
import { Investor } from "../entities/investor"
import { InvestorRepository } from "../repositories/investor-repository"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Name } from "@/domain/value-objects/name"
import { Email } from "@/domain/value-objects/email"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

interface UpdateInvestorServiceRequest {
    investorId: string
    name?: string
    email?: string
}

type UpdateInvestorServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
  investor: Investor
}>

export class UpdateInvestorService {
    constructor(private investorRepository: InvestorRepository) {}

    async execute({
        investorId,
        name,
        email
    }: UpdateInvestorServiceRequest): Promise<UpdateInvestorServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)

        if (!investor) return left(new ResourceNotFoundError())

        if(name == undefined && email == undefined) return left(new NotAllowedError())

        if(!!name) {
            const newName = Name.create(name)
            investor.updateName(newName)
        }

        if(!!email) {
            const newEmail = Email.create(email)
            investor.updateEmail(newEmail)
        }

        await this.investorRepository.update(investor)

        return right({
            investor
        })
    }
}