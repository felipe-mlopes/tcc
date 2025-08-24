import { Either, left, right } from "@/core/either";
import { GoalRepository } from "../repositories/goal-repository";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Goal, Status } from "../entities/goal";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Injectable } from "@nestjs/common";

export interface MarkGoalAsAchievedServiceRequest {
    goalId: string,
    investorId: string,
    reason?: string
}

type MarkGoalAsAchievedServiceResponse = Either<ResourceNotFoundError, {
    goal: Goal
}>

type ValidateServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    goal: Goal
}>

Injectable()
export class MarkGoalAsAchievedService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
    ) {}

    public async execute({
        goalId,
        investorId
    }: MarkGoalAsAchievedServiceRequest): Promise<MarkGoalAsAchievedServiceResponse> {
        const goalValidate = await this.validateRequests({investorId, goalId})
        if (goalValidate.isLeft()) return left(goalValidate.value)

        const { goal } = goalValidate.value

        goal.markAsAchieved()

        await this.goalRepository.update(goal)

        return right({
            goal
        })
    }

    private async validateRequests({
        goalId,
        investorId
    }: MarkGoalAsAchievedServiceRequest): Promise<ValidateServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if(!investor) return left(new ResourceNotFoundError('Investor not found.'))

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new ResourceNotFoundError('Goal not found.'))
        if (goal.status !== Status.Active) return left(new NotAllowedError(
            'Goal cannot be modified because it is not active.'
        ))

        const id = new UniqueEntityID(investorId)
        if (!goal.belongsToUser(id)) return left(new NotAllowedError(
            'You are not allowed to access this goal.'
        ))
        
        return right({
            goal
        })
    }
}