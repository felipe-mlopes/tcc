import { Either, left, right } from "@/core/either";
import { PortfolioRepository } from "../repositories/portfolio-repository";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { Portfolio } from "../entities/portfolio";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Injectable } from "@nestjs/common";

interface CreatePortfolioServiceRequest {
    investorId: string,
    name: string,
    description?: string
}

type CreatePortfolioServiceResponse = Either<ResourceNotFoundError, {
    message: string
}>

@Injectable()
export class CreatePortfolioService {
    constructor(
        private portfolioRepository: PortfolioRepository,
        private investorRepository: InvestorRepository
    ) {}

    public async execute({
        investorId,
        name,
        description
    }: CreatePortfolioServiceRequest): Promise<CreatePortfolioServiceResponse> {
        const investVerified = await this.investorRepository.findById(investorId)
        if (!investVerified) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        const newPortfolio = Portfolio.create({
            investorId: new UniqueEntityID(investorId),
            name,
            description: description || '',
            allocations: []
        })

        await this.portfolioRepository.create(newPortfolio)

        return right({
            message: 'O portfólio foi criado com sucesso'
        })
    }
}