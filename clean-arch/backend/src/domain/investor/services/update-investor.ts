import { Either, left, right } from "@/core/either"
import { Investor } from "../entities/investor"
import { InvestorRepository } from "../repositories/investor-repository"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { Injectable } from "@nestjs/common"

interface UpdateInvestorServiceRequest {
    investorId: string
    name?: string
    email?: string
}

type UpdateInvestorServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
  message: string
}>

@Injectable()
export class UpdateInvestorService {
    constructor(private investorRepository: InvestorRepository) {}

    public async execute({
        investorId,
        name,
        email
    }: UpdateInvestorServiceRequest): Promise<UpdateInvestorServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))
        if(
            (name === undefined || name.trim().length === 0) &&
            (email === undefined || email.trim().length === 0)
        ) return left(new NotAllowedError(
            'Name or email are required.'
        ))

        if(name && name.trim().length > 0) {
            investor.updateName(name)
        }

        const isEmailAlreadyRecord = await this.investorRepository.findByEmail(email) == null

        if(email && email.trim().length > 0 && isEmailAlreadyRecord) {
            investor.updateEmail(email)
        }

        await this.investorRepository.update(investor)

        return right({
            message: 'O cadastro do investidor foi atualizado com sucesso'
        })
    }
}