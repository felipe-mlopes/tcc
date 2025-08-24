import { Either, left, right } from "@/core/either"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { Money } from "@/core/value-objects/money";
import { Goal, Status } from "../entities/goal";
import { InvestorRepository } from "@/domain/investor/repositories/investor-repository";
import { GoalRepository } from "../repositories/goal-repository";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Percentage } from "@/core/value-objects/percentage";
import { Injectable } from "@nestjs/common";

export interface ProjectionScenario {
    monthlyContribution: Money,
    scenarioName: string
}

export interface ProjectionResult {
    scenario: ProjectionScenario,
    projectedCompletionDate: Date,
    monthsToComplete: number,
    totalMonthlyContributionsNeeded: Money,
    willMeetTargetDate: boolean,
    projectedAmount: Money,
    shortfall: Money,
    surplus: Money,
    progressAtTargetDate: Percentage
}

export interface GoalProjectionAnalysis {
    goal: Goal,
    projections: ProjectionResult[],
    recommendedMonthlyContribution: Money,
    minimumMonthlyContribution: Money,
    currentMonthlyRequirement: Money,
    analysisDate: Date
}

export interface CalculateGoalProjectionServiceRequest {
    investorId: string,
    goalId: string,
    scenarios: ProjectionScenario[]
}

type CalculateGoalProjectionServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    analysis: GoalProjectionAnalysis,
    sucess: boolean,
    message?: string
}>

type ValidateServiceResponse = Either<ResourceNotFoundError | NotAllowedError, {
    goal: Goal
}>

@Injectable()
export class CalculateGoalProjectionService {
    constructor(
        private investorRepository: InvestorRepository,
        private goalRepository: GoalRepository
    ) {}

    public async execute({
        investorId,
        goalId,
        scenarios
    }: CalculateGoalProjectionServiceRequest): Promise<CalculateGoalProjectionServiceResponse> {
        const goalValidate = await this.validateRequests({investorId, goalId, scenarios})
        if (goalValidate.isLeft()) return left(goalValidate.value)

        const { goal } = goalValidate.value
        
        const analysis = this.calculateProjections(goal, scenarios)

        return right({
            analysis,
            sucess: true
        })
    }

    private async validateRequests({
        investorId,
        goalId,
        scenarios
    }: CalculateGoalProjectionServiceRequest): Promise<ValidateServiceResponse>
     {
        const investor = await this.investorRepository.findById(investorId)
        if(!investor) return left(new ResourceNotFoundError('Investor not found.'))

        const goal = await this.goalRepository.findById(goalId)
        if (!goal) return left(new ResourceNotFoundError('Goal not found.'))
        if (goal.status !== Status.Active) return left(new NotAllowedError(
            'Goal cannot be modified because it is not active.'
        ))
        
        if (!scenarios || scenarios.length === 0) return left(new NotAllowedError(
            'No scenarios available to proceed.'
        ))

        for (const [idx, scenario] of scenarios.entries()) {
            if (!scenario.monthlyContribution) return left(new NotAllowedError(
                'You must provide at least one scenario to continue.'
            ))
            if (scenario.monthlyContribution.getAmount() < 0) return left(new NotAllowedError(
                'Monthly contribution cannot be negative.'
            ))
            if (scenario.monthlyContribution.getCurrency() !== goal.targetAmount.getCurrency()) return left(new NotAllowedError(
                'Monthly contribution currency must match the target amount currency.'
            ))
        }

        const id = new UniqueEntityID(investorId)
        if(!goal.belongsToUser(id)) return left(new NotAllowedError(
            'You are not allowed to access this goal.'
        ))

        return right({
            goal
        })
    }

    private calculateProjections(
        goal: Goal,
        scenarios: ProjectionScenario[]
    ): GoalProjectionAnalysis {
        const projections = scenarios.map(scenario => {
            return this.calculateProjectionForScenario(goal, scenario)
        })

        return {
            goal,
            projections,
            recommendedMonthlyContribution: this.calculateRecommendedContribution(goal),
            minimumMonthlyContribution: this.calculateMinimumContribution(goal),
            currentMonthlyRequirement: this.calculateCurrentMonthlyRequirement(goal),
            analysisDate: new Date()
        }
    }

    private calculateProjectionForScenario(
        goal: Goal,
        scenario: ProjectionScenario
    ): ProjectionResult {
        const remainingAmount = goal.remainingAmount
        const monthlyContribution = scenario.monthlyContribution
        const targetDate = goal.targetDate
        const today = new Date()

        // Calcula os meses para concluir com base na contribuição mensal 
        const monthsToComplete = monthlyContribution.getAmount() > 0 
            ? Math.ceil(remainingAmount.getAmount() / monthlyContribution.getAmount())
            : Infinity
        
        // Calcula a data prevista de conclusão
        const projectedCompletionDate = monthlyContribution.getAmount() > 0
            ? this.addMonthsToDate(today, monthsToComplete)
            : new Date(9999, 11, 31)
        
        // Calcula os meses até a data alvo
        const monthsUntilTarget = this.calculateMonthsBetweenDates(today, targetDate)

        // Calcula o valor projetado na data alvo
        const contributionsUntilTarget = monthlyContribution.getAmount() * monthsUntilTarget
        const projectedAmount = goal.currentAmount.add(Money.create(contributionsUntilTarget))

        // Calcula o déficit ou superávit
        const difference = projectedAmount.subtract(goal.targetAmount)
        const shortfall = difference.getAmount() < 0
            ? Money.create(Math.abs(difference.getAmount()), goal.targetAmount.getCurrency())
            : Money.zero(goal.targetAmount.getCurrency())

        const surplus = difference.getAmount() > 0
            ? difference
            : Money.zero(goal.targetAmount.getCurrency())

        // Calcula o progresso na data alvo
        const progressAtTargetDate = goal.targetAmount.getAmount() > 0
            ? Percentage.fromDecimal(
                Math.min(projectedAmount.getAmount() / goal.targetAmount.getAmount(), 1)
            )
            : Percentage.zero()
            
        const monthlyContributionsNeeded = monthsToComplete === Infinity 
            ? 0 
            : monthlyContribution.getAmount() * monthsToComplete

        const totalMonthlyContributionsNeeded = Money.create(
            monthlyContributionsNeeded,
            goal.targetAmount.getCurrency()
        )

        return {
            scenario,
            projectedCompletionDate,
            monthsToComplete: monthsToComplete === Infinity ? -1 : monthsToComplete,
            totalMonthlyContributionsNeeded,
            willMeetTargetDate: projectedCompletionDate <= targetDate,
            projectedAmount,
            shortfall,
            surplus,
            progressAtTargetDate
        }
    }

    private calculateRecommendedContribution(goal: Goal): Money {
        const remainingAmount = goal.remainingAmount
        const monthsUntilTarget = this.calculateMonthsBetweenDates(
            new Date(), goal.targetDate
        )

        if (monthsUntilTarget <= 0) return remainingAmount

        const recommendedAmount = remainingAmount.getAmount() * 1.1 / monthsUntilTarget
        return Money.create(recommendedAmount, goal.targetAmount.getCurrency())
    }

    private calculateMinimumContribution(goal: Goal): Money {
        const remainingAmount = goal.remainingAmount
        const monthsUntilTarget = this.calculateMonthsBetweenDates(
            new Date(), goal.targetDate
        )

        if (monthsUntilTarget <= 0) return remainingAmount

        const minimumAmount = remainingAmount.getAmount() / monthsUntilTarget
        return Money.create(minimumAmount, goal.targetAmount.getCurrency())
    }

    private calculateCurrentMonthlyRequirement(goal: Goal): Money {
        return this.calculateMinimumContribution(goal)
    }

    private addMonthsToDate(date: Date, months: number): Date {
        const result = new Date(date)
        result.setMonth(result.getMonth() + months)
        return result
    }

    private calculateMonthsBetweenDates(startDate: Date, endDate: Date): number {
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

        const yearDiff = end.getFullYear() - start.getFullYear()
        const monthDiff = end.getMonth() - start.getMonth()
        const dayDiff = end.getDate() - start.getDate()

        let totalMonths = yearDiff * 12 + monthDiff

        if (dayDiff > 0) totalMonths += 1

        return Math.max(totalMonths, 0)
    }
}