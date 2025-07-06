import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Goal, Priority, Status } from "../entities/goal";
import { Money } from "@/core/value-objects/money";

export interface EditInvestmentGoalServiceRequest {
    investorId: string,
    goalId: string,
    name?: string,
    description?: string,
    targetAmount?: number,
    targetDate?: Date
    priority?: Priority,
    status?: Status
}

type EditInvestmentGoalServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    goal: Goal
}>

export class EditInvestmentGoalService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
    ) {}

    async execute({
        investorId,
        goalId,
        name,
        description,
        targetAmount,
        targetDate,
        priority,
        status
    }: EditInvestmentGoalServiceRequest): Promise<EditInvestmentGoalServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new NotAllowedError())

        if (
            name === undefined ||
            description === undefined ||
            targetAmount === undefined ||
            targetDate === undefined ||
            priority === undefined ||
            status === undefined
        ) return left(new NotAllowedError())

        const newTargetAmount = Money.create(targetAmount)

        if (name !== undefined) goal.updateName(name)
        if (description !== undefined) goal.updateDescription(description)
        if (targetAmount !== undefined) goal.updateTargetAmount(newTargetAmount)
        if (targetDate !== undefined) goal.updateTargetDate(targetDate)
        
        if (priority !== undefined ||
            priority !== goal.priority
        ) goal.updatePriority(priority)

        if (status !== goal.status) {
            if (status === Status.Achieved) goal.markAsAchieved()
            if (status === Status.Cancelled) goal.cancel()
            if (status === Status.Active) goal.reactivate()
        }

        return right({
            goal
        })
    }
}