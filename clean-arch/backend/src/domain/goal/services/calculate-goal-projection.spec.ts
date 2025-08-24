import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryGoalRepository } from "test/repositories/in-memory-goal-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Goal, Status } from "../entities/goal"
import { CalculateGoalProjectionService, ProjectionScenario } from "./calculate-goal-projection"
import { Money } from "@/core/value-objects/money"
import { makeInvestor } from "test/factories/make-investor"
import { makeGoal } from "test/factories/make-goal"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryGoalRepository: InMemoryGoalRepository
let sut: CalculateGoalProjectionService

let newInvestor: Investor
let newGoal: Goal
let investorId: string
let goalId: string

describe('Calculate Investment Goal Projection', () => {
    beforeEach(async () => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryGoalRepository = new InMemoryGoalRepository()
        sut = new CalculateGoalProjectionService(
            inMemoryInvestorRepository,
            inMemoryGoalRepository
        )

        newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)
        investorId = newInvestor.id.toValue().toString()

        newGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(10000, 'BRL'),
            currentAmount: Money.create(2000, 'BRL'),
            targetDate: new Date('2025-12-31')
        })
        await inMemoryGoalRepository.create(newGoal)
        goalId = newGoal.id.toValue().toString()
    })

    it('should be able to calculate goal projection', async () => {

        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            },
            {
                monthlyContribution: Money.create(1500, 'BRL'),
                scenarioName: 'Agressive'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if(result.isRight()) {
            expect(result.value.sucess).toBe(true)
            expect(result.value.analysis).toBeDefined()
            expect(result.value.analysis.goal).toBeDefined()
            expect(result.value.analysis.projections).toHaveLength(2)
            expect(result.value.analysis.recommendedMonthlyContribution).toBeDefined()
            expect(result.value.analysis.minimumMonthlyContribution).toBeDefined()
            expect(result.value.analysis.currentMonthlyRequirement).toBeDefined()
            expect(result.value.analysis.analysisDate).toBeInstanceOf(Date)

        }
    })

    it('should be able to calculate projection with sufficient monthly contribution', async () => {

        // Arranje
        const targetDate = new Date()
        targetDate.setFullYear(targetDate.getFullYear() + 2)

        const goalWithLongerTarget = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(5000, 'BRL'),
            currentAmount: Money.create(2000, 'BRL'),
            targetDate
        })
        await inMemoryGoalRepository.create(goalWithLongerTarget)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: goalWithLongerTarget.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const projection = result.value.analysis.projections[0]

            expect(projection.scenario).toBe(scenarios[0])
            expect(projection.monthsToComplete).toBe(3) // 3000 / 1000
            expect(projection.willMeetTargetDate).toBe(true) // 3m < 24m
            expect(projection.projectedCompletionDate).toBeInstanceOf(Date)
            expect(projection.totalMonthlyContributionsNeeded.getAmount()).toBe(3000)
            expect(projection.shortfall.getAmount()).toBe(0)
            expect(projection.surplus.getAmount()).toBeGreaterThan(0)
        }
    })

    it('should be able to calculate projection with zero monthly contribution', async () => {

        // Arranje
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(0, 'BRL'),
                scenarioName: 'No Contribution'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const projection = result.value.analysis.projections[0]
            
            expect(projection.monthsToComplete).toBe(-1) // Infinity converted to -1
            expect(projection.willMeetTargetDate).toBe(false)
            expect(projection.projectedCompletionDate.getFullYear()).toBe(9999)
            expect(projection.totalMonthlyContributionsNeeded.getAmount()).toBe(0)
            expect(projection.shortfall.getAmount()).toBe(8000) // Remaining amount
            expect(projection.surplus.getAmount()).toBe(0)
        }
    })

    it('should be able to calculate projection with insufficient monthly contribution', async () => {

        // Arranje
        const shortTermGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(10000, 'BRL'),
            currentAmount: Money.create(2000, 'BRL'),
            targetDate: new Date('2025-08-31') // Short term target
        })
        await inMemoryGoalRepository.create(shortTermGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(100, 'BRL'),
                scenarioName: 'Insufficient'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: shortTermGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const projection = result.value.analysis.projections[0]

            expect(projection.willMeetTargetDate).toBe(false)
            expect(projection.shortfall.getAmount()).toBeGreaterThan(0)
            expect(projection.surplus.getAmount()).toBe(0)
        }
    })

    it('should be able to calculate recommended contribution with buffer', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const recommended = result.value.analysis.recommendedMonthlyContribution
            const minimum = result.value.analysis.minimumMonthlyContribution

            expect(recommended.getAmount()).toBeGreaterThan(minimum.getAmount())
            expect(recommended.getAmount()).toBe(minimum.getAmount() * 1.1)
        }
    })

    it('should be able to calculate projection for goal already completed', async () => {
        
        // Arrange
        const completedGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(10000, 'BRL'),
            currentAmount: Money.create(12000, 'BRL') // More than target
        })
        await inMemoryGoalRepository.create(completedGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: completedGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const projection = result.value.analysis.projections[0]
            expect(projection.monthsToComplete).toBe(0)
            expect(projection.surplus.getAmount()).toBeGreaterThan(0)
            expect(projection.shortfall.getAmount()).toBe(0)
        }
    })

    it('should be able to calculate projection for goal with surplus', async () => {

        // Arrange
        const surplusGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(10000, 'BRL'),
            currentAmount: Money.create(15000, 'BRL')
        })
        await inMemoryGoalRepository.create(surplusGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: surplusGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if(result.isRight()) {
            const projection = result.value.analysis.projections[0]

            expect(projection.monthsToComplete).toBe(0)
            expect(projection.surplus.getAmount()).toBeGreaterThan(0)
            expect(projection.shortfall.getAmount()).toBe(0)
        }
    })

    it('should be able to handle goal with zero target amount', async () => {
        
        // Arrange
        const zeroTargetGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(0, 'BRL'),
            currentAmount: Money.create(0, 'BRL')
        })
        await inMemoryGoalRepository.create(zeroTargetGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: zeroTargetGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const projection = result.value.analysis.projections[0]
            expect(projection.progressAtTargetDate.getValue()).toBe(0)
        }
    })

    it('should be able to handle goal with past target date', async () => {
        
        // Arrange
        const pastGoal = makeGoal({
            investorId: newInvestor.id,
            targetAmount: Money.create(10000, 'BRL'),
            currentAmount: Money.create(2000, 'BRL'),
            targetDate: new Date('2020-01-01')
        })
        await inMemoryGoalRepository.create(pastGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: pastGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const recommended = result.value.analysis.recommendedMonthlyContribution
            expect(recommended.getAmount()).toBe(8000) // Remaining amount
        }
    })

    it('should not be able to calculate projection for non-existent investor', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId: 'non-existent-investor-id',
            goalId,
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should not be able to calculate projection for non-existent goal', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: 'non-existent-goal-id',
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Goal not found.')
        }
    })

    it('should not be able to calculate projection for inactive goal', async () => {

        // Arrange
        const inactiveGoal = makeGoal({
            investorId: newInvestor.id,
            status: Status.Cancelled
        })
        await inMemoryGoalRepository.create(inactiveGoal)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: inactiveGoal.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Goal cannot be modified because it is not active.'
            )
        }
    })

    it('should not be able to calculate projection with empty scenarios', async () => {
        
        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios: []
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'No scenarios available to proceed.'
            )
        }
    })

    it('should not be able to calculate projection with negative monthly contribution', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(-100, 'BRL'),
                scenarioName: 'Invalid'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Monthly contribution cannot be negative.'
            )
        }
    })

    it('should not be able to calculate projection with wrong currency', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'USD'),
                scenarioName: 'Wrong Currency'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Monthly contribution currency must match the target amount currency.'
            )
        }
    })

    it('should not be able to calculate projection for goal from different investor', async () => {
        
        // Arrange
        const anotherInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(anotherInvestor)

        const goalFromAnotherInvestor = makeGoal({
            investorId: anotherInvestor.id
        })
        await inMemoryGoalRepository.create(goalFromAnotherInvestor)

        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Conservative'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId: goalFromAnotherInvestor.id.toValue().toString(),
            scenarios
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'You are not allowed to access this goal.'
            )
        }
    })

    it('should be able to calculate projection with multiple scenarios', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(500, 'BRL'),
                scenarioName: 'Conservative'
            },
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Moderate'
            },
            {
                monthlyContribution: Money.create(1500, 'BRL'),
                scenarioName: 'Aggressive'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const analysis = result.value.analysis
            expect(analysis.projections).toHaveLength(3)
            
            // Conservative scenario should take longer
            expect(analysis.projections[0].monthsToComplete).toBeGreaterThan(analysis.projections[1].monthsToComplete)
            expect(analysis.projections[1].monthsToComplete).toBeGreaterThan(analysis.projections[2].monthsToComplete)
            
            // All scenarios should have the same target
            analysis.projections.forEach(projection => {
                expect(projection.scenario.monthlyContribution.getCurrency()).toBe('BRL')
                expect(projection.projectedCompletionDate).toBeInstanceOf(Date)
            })
        }
    })

    it('should be able to calculate projection and verify date calculations', async () => {
        
        // Arrange
        const scenarios: ProjectionScenario[] = [
            {
                monthlyContribution: Money.create(1000, 'BRL'),
                scenarioName: 'Test'
            }
        ]

        // Act
        const result = await sut.execute({
            investorId,
            goalId,
            scenarios
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const analysis = result.value.analysis
            const projection = analysis.projections[0]
            
            expect(analysis.analysisDate).toBeInstanceOf(Date)
            expect(projection.projectedCompletionDate).toBeInstanceOf(Date)
            expect(projection.projectedCompletionDate.getTime()).toBeGreaterThan(analysis.analysisDate.getTime())
        }
    })
})