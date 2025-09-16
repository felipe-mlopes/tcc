import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { UpdateGoalProgressService } from "./update-goal-progress"
import { InMemoryGoalRepository } from "test/repositories/in-memory-goal-repository"
import { Investor } from "@/domain/investor/entities/investor"
import { Goal } from "../entities/goal"
import { makeInvestor } from "test/factories/make-investor"
import { makeGoal } from "test/factories/make-goal"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryGoalRepository: InMemoryGoalRepository
let sut: UpdateGoalProgressService

let newInvestor: Investor
let newGoal: Goal
let investorId: string
let goalId: string

describe('Update Investment Goal Progress', () => {
    beforeEach(async () => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryGoalRepository = new InMemoryGoalRepository()
        sut = new UpdateGoalProgressService(
            inMemoryInvestorRepository,
            inMemoryGoalRepository
        )

        newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)
        investorId = newInvestor.id.toValue().toString()

        newGoal = makeGoal({
            investorId: newInvestor.id
        })
        await inMemoryGoalRepository.create(newGoal)
        goalId = newGoal.id.toValue().toString()
    })

    it('should be able to update investment goal progress', async () => {
        
        // Verify investor and goal was created
        const investorVerified = await inMemoryInvestorRepository.findById(investorId)
        const goalVerified = await inMemoryGoalRepository.findById(goalId)

        expect(investorVerified).not.toBeNull()
        expect(goalVerified).not.toBeNull()

        // Act
        const result = await sut.execute({
            goalId,
            investorId
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { progress } = result.value
            expect(inMemoryGoalRepository.items[0]).toMatchObject({
               progress
            })     
        }
    })

    it('should not be able to edit a goal with non-existent investor', async () => {
            
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

    it('should not be able to edit a non-existent goal', async () => {
        
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
})