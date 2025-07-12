import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Goal, Priority } from "../entities/goal";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { Money } from "@/core/value-objects/money";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface RegisterInvestmentGoalServiceRequest {
    investorId: string,
    name: string,
    description?: string,
    targetAmount: number,
    targetDate: Date,
    priority: Priority
}

type RegisterInvestmentGoalServiceResponse = Either<ResourceNotFoundError, {
    goal: Goal
}>

export class RegisterInvestmentGoalService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
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
        if (!investor) return left(new ResourceNotFoundError())

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
            goal
        })
    }
}