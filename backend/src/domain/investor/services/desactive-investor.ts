import { Either, left, right } from "@/core/either"
import { InvestorRepository } from "../repositories/investor-repository"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"

interface DesactiveInvestorServiceRequest {
    investorId: string
}

type DesactiveInvestorServiceResponse = Either<ResourceNotFoundError, {
    message: string
}>

export class DesactiveInvestorService {
    constructor(private investorRepository: InvestorRepository) {}

    public async execute({
        investorId
    }: DesactiveInvestorServiceRequest): Promise<DesactiveInvestorServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        investor.desactive()

        await this.investorRepository.update(investor)

        return right({
            message: 'The investor has been desactive.'
        })
    }
}