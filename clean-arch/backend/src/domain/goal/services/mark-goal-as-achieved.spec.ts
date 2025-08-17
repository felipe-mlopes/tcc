import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryGoalRepository } from "test/repositories/in-memory-goal-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Goal, Status } from "../entities/goal"
import { MarkGoalAsAchievedService } from "./mark-goal-as-achieved"
import { makeInvestor } from "test/factories/make-investor"
import { makeGoal } from "test/factories/make-goal"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"
import { NotAllowedError } from "@/core/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryGoalRepository: InMemoryGoalRepository
let sut: MarkGoalAsAchievedService

let newInvestor: Investor
let newGoal: Goal
let investorId: string
let goalId: string

describe('Mark Investment Goal As Achieved', () => {
    beforeEach(async () => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryGoalRepository = new InMemoryGoalRepository()
        sut = new MarkGoalAsAchievedService(
            inMemoryInvestorRepository,
            inMemoryGoalRepository
        )

        newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)
        investorId = newInvestor.id.toValue().toString()

        newGoal = makeGoal({
            investorId: newInvestor.id,
            status: Status.Active
        })
        await inMemoryGoalRepository.create(newGoal)
        goalId = newGoal.id.toValue().toString()
    })

    it('should be able to mark investment goal as achieved', async () => {

        // Verify investor and goal was created
        const investorVerified = await inMemoryInvestorRepository.findById(investorId)
        const goalVerified = await inMemoryGoalRepository.findById(goalId)
        
        expect(investorVerified).not.toBeNull()
        expect(goalVerified).not.toBeNull()
        expect(goalVerified?.status).toBe(Status.Active)
        
        expect(goalVerified?.investorId.toValue().toString()).toBe(investorId)

        // Act
        const result = await sut.execute({
            goalId: newGoal.id.toValue().toString(),
            investorId: newInvestor.id.toValue().toString()
        })

        // Assert
        if (result.isLeft()) {
            console.log('Error:', result.value)
            console.log('Goal investorId:', goalVerified?.investorId.toValue().toString())
            console.log('Expected investorId:', investorId)
        }

        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { goal } = result.value
            expect(goal.status).toBe(Status.Achieved)    
        }
    })

    it('should not be able to mark investment goal with non-existent investor', async () => {
            
        // Act
        const result = await sut.execute({
            goalId,
            investorId: 'non-existent-investor-id',
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should not be able to mark a non-existent goal', async () => {
        
        // Act
        const result = await sut.execute({
            goalId: 'non-existent-goal-id',
            investorId,
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Goal not found.')
        }
    })

    it('should not be able to mark when goal status is not Active', async () => {
        
        // Arrange
        const achievedGoal = makeGoal({
            investorId: newInvestor.id,
            status: Status.Achieved
        })
        await inMemoryGoalRepository.create(achievedGoal)

        // Act
        const result = await sut.execute({
            goalId: achievedGoal.id.toValue().toString(),
            investorId,
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

    it('should not be able to mark when goal belongs to different user', async () => {
        
        // Arrange
        const differentInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(differentInvestor)

        const goalFromDifferentUser = makeGoal({
            investorId: newInvestor.id,
            status: Status.Active
        })
        await inMemoryGoalRepository.create(goalFromDifferentUser)

        // Act
        const result = await sut.execute({
            goalId: goalFromDifferentUser.id.toValue().toString(),
            investorId: differentInvestor.id.toValue().toString()
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

    it('should not be able to mark when goal status is Canceled', async () => {
    
        // Arrange
        const canceledGoal = makeGoal({
            investorId: newInvestor.id,
            status: Status.Cancelled
        })
        await inMemoryGoalRepository.create(canceledGoal)

        // Act
        const result = await sut.execute({
            goalId: canceledGoal.id.toValue().toString(),
            investorId,
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
        }
    })

    it('should handle optional reason parameter', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            reason: 'Goal completed successfully'
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const { goal } = result.value
            expect(goal.status).toBe(Status.Achieved)
        }
    })

    it('should not affect other goals when marking one as achieved', async () => {
        
        // Arrange
        const anotherGoal = makeGoal({
            investorId: newInvestor.id,
            status: Status.Active
        })
        await inMemoryGoalRepository.create(anotherGoal)

        // Act
        const result = await sut.execute({
            goalId,
            investorId
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        // Verificar se apenas o goal correto foi marcado como achieved
        const updatedGoal = await inMemoryGoalRepository.findById(goalId)
        const untouchedGoal = await inMemoryGoalRepository.findById(anotherGoal.id.toValue().toString())
        
        expect(updatedGoal?.status).toBe(Status.Achieved)
        expect(untouchedGoal?.status).toBe(Status.Active)
    })
})