import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository";
import { InMemoryGoalRepository } from "test/repositories/in-memory-goal-repository";
import { makeGoal } from "test/factories/make-goal";
import { Goal, Priority, Status } from "../entities/goal";
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error";
import { makeInvestor } from "test/factories/make-investor";
import { UpdateInvestmentGoalService } from "./update-investment-goal";
import { Investor } from "@/domain/investor/entities/investor";
import { NotAllowedError } from "@/core/errors/not-allowed-error";

let inMemoryInvestorRepository: InMemoryInvestorRepository
let inMemoryGoalRepository: InMemoryGoalRepository
let sut: UpdateInvestmentGoalService

let newInvestor: Investor
let newGoal: Goal
let investorId: string
let goalId: string

describe('Update Investment Goal', () => {
    beforeEach(async () => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        inMemoryGoalRepository = new InMemoryGoalRepository()
        sut = new UpdateInvestmentGoalService(
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

    it('should be able to update a investment goal with all fields', async () => {    

        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            name: 'Updated Investment Goal',
            description: 'Updated description',
            targetDate: new Date('2050-12-31'),
            targetAmount: 500000,
            priority: Priority.Medium,
            status: Status.Active
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0]).toMatchObject({
                name: newGoal.name,
                description: newGoal.description,
                targetDate: newGoal.targetDate,
                targetAmount: newGoal.targetAmount,
                priority: newGoal.priority
            })     
        }
    })

    it('should be able to update only name', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            name: 'Only Name Updated'
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].name).toBe('Only Name Updated')
        }
    })

    it('should be able to update only description', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            description: 'Only Description Updated'
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].description).toBe('Only Description Updated')
        }
    })

    it('should be able to update only target amount', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            targetAmount: 750000
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].targetAmount.getAmount()).toBe(750000)
        }
    })

    it('should be able to update only target date', async () => {
        
        // Arrange
        const newDate = new Date('2055-01-01')
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            targetDate: newDate
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].targetDate).toEqual(newDate)
        }
    })

    it('should be able to update only priority', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            priority: Priority.Low
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].priority).toBe(Priority.Low)
        }
    })

    it('should be able to mark goal as achieved', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            status: Status.Achieved
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].status).toBe(Status.Achieved)
        }
    })

    it('should be able to cancel a goal', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            status: Status.Cancelled
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].status).toBe(Status.Cancelled)
        }
    })

    it('should be able to reactivate a goal', async () => {

        // Arrange
        newGoal.cancel()

        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            status: Status.Active
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].status).toBe(Status.Active)
        }
    })

    it('should not be able to update a goal with non-existent investor', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId: 'non-existent-investor-id',
            name: 'Updated Name'
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should not be able to update a non-existent goal', async () => {
        
        // Act
        const result = await sut.execute({
            goalId: 'non-existent-goal-id',
            investorId,
            name: 'Updated Name'
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Goal not found.')
        }
    })

    it('should not be able to update a goal without providing any field', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('It is necessary to inform some change field.')
        }
    })

    it('should not update priority if it is the same as current', async () => {
        
        // Arrange
        const currentPriority = newGoal.priority

        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            priority: currentPriority
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].priority).toBe(currentPriority)
        }
    })

    it('should not update status if it is the same as current', async () => {
        
        // Arrange
        const currentStatus = newGoal.status
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            status: currentStatus
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].status).toBe(currentStatus)
        }
    })

    it('should be able to update multiple fields at once', async () => {
        
        // Act
        const result = await sut.execute({
            goalId,
            investorId,
            name: 'Multi Update Goal',
            targetAmount: 1000000,
            priority: Priority.High
        })

        // Assert
        expect(result.isRight()).toBe(true)
        
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('Meta de investimento atualizada com sucesso')
            expect(inMemoryGoalRepository.items[0].name).toBe('Multi Update Goal')
            expect(inMemoryGoalRepository.items[0].targetAmount.getAmount()).toBe(1000000)
            expect(inMemoryGoalRepository.items[0].priority).toBe(Priority.High)
        }
    })
})