import { Investor } from "@/domain/investor/entities/investor"
import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { InMemoryPortfolioRepository } from "test/repositories/in-memory-portfolio-repository"
import { CreatePortfolioService } from "./create-portfolio"
import { makeInvestor } from "test/factories/make-investor"
import { ResourceNotFoundError } from "@/core/errors/resource-not-found-error"

let inMemoryPortfolioRepository: InMemoryPortfolioRepository
let inMemoryInvestorRepository: InMemoryInvestorRepository
let sut: CreatePortfolioService

let newInvestor: Investor
let investorId: string

describe('Create Portfolio', () => {
    beforeEach(async () => {
        inMemoryPortfolioRepository = new InMemoryPortfolioRepository()
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        sut = new CreatePortfolioService(
            inMemoryPortfolioRepository,
            inMemoryInvestorRepository
        )

        newInvestor = makeInvestor()
        await inMemoryInvestorRepository.create(newInvestor)
        investorId = newInvestor.id.toValue().toString()
    })

    it('should be able to create a portfolio with all fields', async () => {

        // Act
        const result = await sut.execute({
            investorId,
            name: 'My Investment Portfolio',
            description: 'Portfolio for long-term investments'
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O portfólio foi criado com sucesso')
            expect(inMemoryPortfolioRepository.items[0].name).toBe('My Investment Portfolio')
            expect(inMemoryPortfolioRepository.items[0].description).toBe('Portfolio for long-term investments')
            expect(inMemoryPortfolioRepository.items[0].investorId.toValue().toString()).toBe(investorId)
            expect(inMemoryPortfolioRepository.items[0].allocations).toEqual([])
            expect(inMemoryPortfolioRepository.items).toHaveLength(1)
        }
    })

    it('should be able to create a portfolio without description', async () => {

        // Act
        const result = await sut.execute({
            investorId,
            name: 'My Investment Portfolio'
        })

        // Assert
        expect(result.isRight()).toBe(true)
        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O portfólio foi criado com sucesso')
            expect(inMemoryPortfolioRepository.items[0].name).toBe('My Investment Portfolio')
            expect(inMemoryPortfolioRepository.items[0].description).toBe('')
            expect(inMemoryPortfolioRepository.items[0].investorId.toValue().toString()).toBe(investorId)
        }
    })

    it('should not be able to create a portfolio with non-existent investor', async () => {

        // Act
        const result = await sut.execute({
            investorId: 'non-existent-investor-id',
            name: 'Portfolio Name'
        })

        // Assert
        expect(result.isLeft()).toBe(true)
        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(ResourceNotFoundError)
            expect(result.value.message).toBe('Investor not found.')
        }
    })
})