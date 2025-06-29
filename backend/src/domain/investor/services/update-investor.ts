import { Either, left, right } from "@/core/either"
import { Investor } from "../entities/investor"
import { InvestorRepository } from "../repositories/investor-repository"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
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
            investor.updateName(name)
        }

        if(!!email) {
            investor.updateEmail(email)
        }

        await this.investorRepository.update(investor)

        return right({
            investor
        })
    }
}