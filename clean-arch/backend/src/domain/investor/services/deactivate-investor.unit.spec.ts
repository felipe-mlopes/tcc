import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { makeInvestor } from "test/factories/make-investor"
import { DeactivateInvestorService } from "./deactivate-investor"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let sut: DeactivateInvestorService

describe('Desactive Investor', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        sut = new DeactivateInvestorService(inMemoryInvestorRepository)
    })

    it('should be able to desactive investor record', async () => {
        
        // Arrange
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString()
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            expect(result.value.message).toBe('Investidor desativado com sucesso')
            expect(inMemoryInvestorRepository.items[0].isActive).toBe(false)
        }
    })

    it('should be not able to desactive investor without recorded investor', async () => {
        
        // Arrange
        const investor = makeInvestor()

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found')
        }
    })
})