import { Either, left, right } from "@/core/either"
import { InvestorRepository } from "../repositories/investor-repository"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Injectable } from "@nestjs/common"

interface DeactivateInvestorServiceRequest {
    investorId: string
}

type DeactivateInvestorServiceResponse = Either<ResourceNotFoundError, {
    message: string
}>

@Injectable()
export class DeactivateInvestorService {
    constructor(private investorRepository: InvestorRepository) {}

    public async execute({
        investorId
    }: DeactivateInvestorServiceRequest): Promise<DeactivateInvestorServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found'
        ))

        investor.desactive()

        await this.investorRepository.update(investor)

        return right({
            message: 'Investidor desativado com sucesso'
        })
    }
}