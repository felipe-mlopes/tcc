import { Either, left, right } from "@/shared/exceptions/either";
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error";
import { Goal, Priority } from "../entities/goal";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { Money } from "@/core/value-objects/money";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Injectable } from "@nestjs/common";

export interface RegisterInvestmentGoalServiceRequest {
    investorId: string,
    name: string,
    description?: string,
    targetAmount: number,
    targetDate: Date,
    priority: Priority
}

type RegisterInvestmentGoalServiceResponse = Either<ResourceNotFoundError, {
    message: string
}>

@Injectable()
export class RegisterInvestmentGoalService {
    constructor(
        readonly investorRepository: InvestorRepository,
        readonly goalRepository: GoalRepository
    ) {}

    public async execute({
        investorId,
        name,
        description,
        targetAmount,
        targetDate,
        priority
    }: RegisterInvestmentGoalServiceRequest): Promise<RegisterInvestmentGoalServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError(
            'Investor not found.'
        ))

        const targetAmountFormatted = Money.create(targetAmount)

        const goal = Goal.create({
            investorId: new UniqueEntityID(investorId),
            name,
            description: description || null,
            targetAmount: targetAmountFormatted,
            targetDate,
            priority
        })

        await this.goalRepository.create(goal)

        return right({
            message: 'A meta de investimento foi cadastrada com sucesso'
        })
    }
}