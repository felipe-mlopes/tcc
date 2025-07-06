import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { NotAllowedError } from "@/core/errors/not-allowed-error";
import { Percentage } from "@/core/value-objects/percentage";

export interface UpdateGoalProgressServiceRequest {
    investorId: string,
    goalId: string
}

type UpdateGoalProgressServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    progress: Percentage
}>

export class UpdateGoalProgressService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
    ) {}

    async execute({
        investorId,
        goalId
    }: UpdateGoalProgressServiceRequest): Promise<UpdateGoalProgressServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError())

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new NotAllowedError())

        const progress = goal.progress

        return right({
            progress
        })
    }
}