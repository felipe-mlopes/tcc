import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository";
import { RegisterInvestmentGoalService } from "./register-investment-goal";
import { InMemoryGoalRepository } from "test/repositories/in-memory-goal-repository";
import { makeGoal } from "test/factories/make-goal";
import { Goal } from "../entities/goal";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { makeInvestor } from "test/factories/make-investor";

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryGoalRepository: InMemoryGoalRepository
let sut: RegisterInvestmentGoalService

describe('Register Goal', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryGoalRepository = new InMemoryGoalRepository()
        sut = new RegisterInvestmentGoalService(
            inMemoryInvestorRepository,
            inMemoryGoalRepository
        )
    })

    it('should be able to register a investment goal', async () => {
        
        // Arrange
        const newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)

        
        const newGoal = makeGoal({
            investorId: newInvestor.id
        })
        
        // Verify investor was created
        const investorId = newInvestor.id.toValue().toString()
        const investor = await inMemoryInvestorRepository.findById(investorId)

        expect(investor).not.toBeNull()

        // Act
        const result = await sut.execute({
            investorId,
            name: newGoal.name,
            description: newGoal.description!,
            targetAmount: newGoal.targetAmount.getAmount(),
            targetDate: newGoal.targetDate,
            priority: newGoal.priority
        })

        // Assert
        expect(result.isRight()).toBe(true)

        const { goal } = result.value as { goal: Goal }
        expect(inMemoryGoalRepository.items[0]).toEqual(goal)
        expect(goal.name).toBe(newGoal.name)
        expect(goal.description).toBe(newGoal.description)
        expect(goal.targetAmount.getAmount()).toBe(newGoal.targetAmount.getAmount())
        expect(goal.targetDate).toBe(newGoal.targetDate)
        expect(goal.priority).toBe(newGoal.priority)

        expect(inMemoryGoalRepository.items).toHaveLength(1)
    })

    it('should be not able to register a investment goal without recorded investor', async () => {
        
        // Arrange
        const fakeGoal = makeGoal()
                
        // Act
        const result = await sut.execute({
            investorId: 'investor-1',
            name: fakeGoal.name,
            description: fakeGoal.description!,
            targetAmount: fakeGoal.targetAmount.getAmount(),
            targetDate: fakeGoal.targetDate,
            priority: fakeGoal.priority
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if(result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })
})