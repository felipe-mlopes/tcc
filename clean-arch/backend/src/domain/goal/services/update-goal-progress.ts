import { Either, left, right } from "@/core/either";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { Percentage } from "@/core/value-objects/percentage";
import { Injectable } from "@nestjs/common";

export interface UpdateGoalProgressServiceRequest {
    investorId: string,
    goalId: string
}

type UpdateGoalProgressServiceResponse = Either<ResourceNotFoundError, {
    progress: Percentage
}>

Injectable()
export class UpdateGoalProgressService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
    ) {}

    public async execute({
        investorId,
        goalId
    }: UpdateGoalProgressServiceRequest): Promise<UpdateGoalProgressServiceResponse> {
        const investor = await this.investorRepository.findById(investorId)
        if (!investor) return left(new ResourceNotFoundError("Investor not found."))

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new ResourceNotFoundError("Goal not found."))

        const progress = goal.progress

        return right({
            progress
        })
    }
}