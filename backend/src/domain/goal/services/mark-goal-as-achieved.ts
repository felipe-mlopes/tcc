import { Either, left, right } from "@/core/either";
import { GoalRepository } from "../repositories/goal-repository";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { Goal, Status } from "../entities/goal";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

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
        if(!investor) return left(new ResourceNotFoundError())

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new ResourceNotFoundError())
        if (goal.status !== Status.Active) return left(new NotAllowedError())

        const id = new UniqueEntityID(investorId)
        if (goal.belongsToUser(id)) return left(new ResourceNotFoundError())
        
        return right({
            goal
        })
    }
}