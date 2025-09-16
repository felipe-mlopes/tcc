import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { makeInvestor } from "test/factories/make-investor"
import { ResourceNotFoundError } from "@/shared/exceptions/errors/resource-not-found-error"
import { UpdateInvestorService } from "./update-investor"
import { NotAllowedError } from "@/shared/exceptions/errors/not-allowed-error"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let sut: UpdateInvestorService

describe('Update Investor', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        sut = new UpdateInvestorService(inMemoryInvestorRepository)
    })

    it('should be able to update investor record with new name and new email', async () => {
        
        // Arrange
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            email: 'new-investor@example.com',
            name: 'New Investor'
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro do investidor foi atualizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].updatedAt).toBeDefined()
            expect(inMemoryInvestorRepository.items[0].name).toBe('New Investor')
            expect(inMemoryInvestorRepository.items[0].email).toBe('new-investor@example.com')
        }
    })

    it('should be able to update investor record with new name only', async () => {
        
        // Arrange
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            name: 'New Investor'
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro do investidor foi atualizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].updatedAt).toBeDefined()
            expect(inMemoryInvestorRepository.items[0].name).toBe('New Investor')
        }
    })

    it('should be able to update investor record with new email only', async () => {
        
        // Arrange
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString(),
            email: 'new-investor@example.com'
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value
            
            expect(message).toBe('O cadastro do investidor foi atualizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].updatedAt).toBeDefined()
            expect(inMemoryInvestorRepository.items[0].email).toBe('new-investor@example.com')
        }
    })

    it('should be not able to update investor without recorded investor', async () => {
        
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
            expect(result.value.message).toBe('Investor not found.')
        }
    })

    it('should be not able to update investor without having informed anything', async () => {
        
        // Arrange
        const investor = makeInvestor()
        await inMemoryInvestorRepository.create(investor)

        // Act
        const result = await sut.execute({
            investorId: investor.id.toValue().toString()
        })

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe('Name or email are required.')
        }
    })
})