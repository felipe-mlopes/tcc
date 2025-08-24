import { InMemoryInvestorRepository } from "test/repositories/in-memory-investor-repository"
import { RegisterInvestorService } from "./register-investor"
import { makeInvestor } from "test/factories/make-investor"
import { DateOfBirth } from "@/core/value-objects/date-of-birth"
import { InvestorProfile } from "../entities/investor"
import { Email } from "@/core/value-objects/email"
import { NotAllowedError } from "@/core/errors/not-allowed-error"
import { CPF } from "@/core/value-objects/cpf"

let inMemoryInvestorRepository: InMemoryInvestorRepository
let sut: RegisterInvestorService

describe('Register Investor', () => {
    beforeEach(() => {
        inMemoryInvestorRepository = new InMemoryInvestorRepository()
        sut = new RegisterInvestorService(inMemoryInvestorRepository)
    })

    it('should be able to register a investor', async () => {
        
        // Arrange
        const newInvestor = makeInvestor()

        // Act
        const result = await sut.execute({
            name: newInvestor.name,
            cpf: newInvestor.cpf,
            email: newInvestor.email,
            dateOfBirth: newInvestor.dateOfBirth
        })

        // Assert
        expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro de investidor foi realizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].email).toBe(newInvestor.email)
            expect(inMemoryInvestorRepository.items[0].name).toBe(newInvestor.name)
            expect(inMemoryInvestorRepository.items[0].cpf).toBe(newInvestor.cpf)
            expect(inMemoryInvestorRepository.items[0].isActive).toBe(true)
            expect(inMemoryInvestorRepository.items).toHaveLength(1)
        }
    })

    it('should be able to assign the Conservative risk profile to users aged 25-49 during registration', async () => {

        // Arrange
        const dateOfBirth = new Date()
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 30)

        const newInvestor = makeInvestor({
            dateOfBirth: DateOfBirth.create(dateOfBirth)
        })

        // Act
        const result = await sut.execute({
            name: newInvestor.name,
            cpf: newInvestor.cpf,
            email: newInvestor.email,
            dateOfBirth: newInvestor.dateOfBirth
        })

        // Assert
                expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro de investidor foi realizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].riskProfile).toBe(InvestorProfile.Conservative)
        }
    })

    it('should be able to assign the Aggressive risk profile to users under 25 during registration', async () => {

        // Arrange
        const dateOfBirth = new Date()
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 20)

        const newInvestor = makeInvestor({
            dateOfBirth: DateOfBirth.create(dateOfBirth)
        })

        // Act
        const result = await sut.execute({
            name: newInvestor.name,
            cpf: newInvestor.cpf,
            email: newInvestor.email,
            dateOfBirth: newInvestor.dateOfBirth
        })

        // Assert
                expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro de investidor foi realizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].riskProfile).toBe(InvestorProfile.Aggressive)
        }
    })

    it('should be able to assign the Moderate risk profile to users 50 years or older during registration', async () => {

        // Arrange
        const dateOfBirth = new Date()
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 60)

        const newInvestor = makeInvestor({
            dateOfBirth: DateOfBirth.create(dateOfBirth)
        })

        // Act
        const result = await sut.execute({
            name: newInvestor.name,
            cpf: newInvestor.cpf,
            email: newInvestor.email,
            dateOfBirth: newInvestor.dateOfBirth
        })

        // Assert
                expect(result.isRight()).toBe(true)

        if (result.isRight()) {
            const { message } = result.value

            expect(message).toBe('O cadastro de investidor foi realizado com sucesso')
            expect(inMemoryInvestorRepository.items[0].riskProfile).toBe(InvestorProfile.Moderate)
        }
    })

    it('should be not able to register a new investor with email is already in use', async () => {

        // Arrange
        const existingInvestor = makeInvestor({
            email: Email.create('existing-investor@example.com')
        })
        await inMemoryInvestorRepository.create(existingInvestor)

        const newInvestor = makeInvestor({
            email: Email.create('existing-investor@example.com')
        })

        // Act
        const result = await sut.execute(newInvestor)

        // Assert
        expect(result.isLeft()).toBe(true)
        expect(inMemoryInvestorRepository.items).toHaveLength(1)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Email or CPF is already in use.'
            )
        }
    })

    it('should be not able to register a new investor with cpf is already in use', async () => {

        // Arrange
        const existingInvestor = makeInvestor({
            cpf: CPF.create('147.058.985-23')
        })
        await inMemoryInvestorRepository.create(existingInvestor)

        const newInvestor = makeInvestor({
            cpf: CPF.create('147.058.985-23')
        })

        // Act
        const result = await sut.execute(newInvestor)

        // Assert
        expect(result.isLeft()).toBe(true)
        expect(inMemoryInvestorRepository.items).toHaveLength(1)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Email or CPF is already in use.'
            )
        }
    })

    it('should be not able to register a new investor with invalid date of birth', async () => {

        // Arrange
        const invalidDate = new Date('invalid-date')

        const newInvestor = makeInvestor({
            dateOfBirth: DateOfBirth.create(invalidDate)
        })

        // Act
        const result = await sut.execute(newInvestor)

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Invalid date of birth.'
            )
        }
    })

    it('should be not able to register a new investor with date of birth is in the future', async () => {

        // Arrange
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        const newInvestor = makeInvestor({
            dateOfBirth: DateOfBirth.create(futureDate)
        })

        // Act
        const result = await sut.execute(newInvestor)

        // Assert
        expect(result.isLeft()).toBe(true)

        if (result.isLeft()) {
            expect(result.value).toBeInstanceOf(NotAllowedError)
            expect(result.value.message).toBe(
                'Invalid date of birth.'
            )
        }
    })
})