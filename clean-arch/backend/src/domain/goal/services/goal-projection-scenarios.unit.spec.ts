import { Money } from "@/core/value-objects/money"
import { GoalProjectionScenariosService } from "./goal-projection-scenarios"

let sut: GoalProjectionScenariosService

describe('Investment Goal Projection Scenarios', () => {
    beforeEach(async () => {
        sut = new GoalProjectionScenariosService()
    })

    it('should create a conservative scenario with correct properties', async () => {

        // Arrange
            const goalCurrency = 'BRL'
            const amount = 1000

        // Act
        const result = GoalProjectionScenariosService.createConservativeScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Conservative')
        expect(result.monthlyContribution).toBeInstanceOf(Money)
        expect(result.monthlyContribution.getAmount()).toBe(amount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle different currencies in conservative scenario', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const amount = 500

        // Act
        const result = GoalProjectionScenariosService.createConservativeScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Conservative')
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
        expect(result.monthlyContribution.getAmount()).toBe(amount)
    })

    it('should handle zero amount', () => {
        
        // Arrange
        const goalCurrency = 'EUR'
        const amount = 0

        // Act
        const result = GoalProjectionScenariosService.createConservativeScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Conservative')
        expect(result.monthlyContribution.getAmount()).toBe(0)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should create a moderate scenario with correct properties', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const amount = 1500

        // Act
        const result = GoalProjectionScenariosService.createModerateScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Moderate')
        expect(result.monthlyContribution).toBeInstanceOf(Money)
        expect(result.monthlyContribution.getAmount()).toBe(amount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle different currencies in moderate scenario', () => {
        
        // Arrange
        const goalCurrency = 'JPY'
        const amount = 100000

        // Act
        const result = GoalProjectionScenariosService.createModerateScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Moderate')
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
        expect(result.monthlyContribution.getAmount()).toBe(amount)
    })

    it('should create an aggressive scenario with correct properties', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const amount = 2000

        // Act
        const result = GoalProjectionScenariosService.createAgressiveScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Agressive')
        expect(result.monthlyContribution).toBeInstanceOf(Money)
        expect(result.monthlyContribution.getAmount()).toBe(amount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle large amounts in aggressive scenario', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const amount = 10000

        // Act
        const result = GoalProjectionScenariosService.createAgressiveScenario(goalCurrency, amount)

        // Assert
        expect(result.scenarioName).toBe('Agressive')
        expect(result.monthlyContribution.getAmount()).toBe(amount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should create multiple scenarios with different amounts', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const conservativeAmount = 500
        const moderateAmount = 1000
        const aggressiveAmount = 2000

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            conservativeAmount,
            moderateAmount,
            aggressiveAmount
        )

        // Assert
        expect(result).toHaveLength(3)
        
        // Conservative scenario
        expect(result[0].scenarioName).toBe('Conservative')
        expect(result[0].monthlyContribution).toBeInstanceOf(Money)
        expect(result[0].monthlyContribution.getAmount()).toBe(conservativeAmount)
        expect(result[0].monthlyContribution.getCurrency()).toBe(goalCurrency)
        
        // Moderate scenario
        expect(result[1].scenarioName).toBe('Moderate')
        expect(result[1].monthlyContribution).toBeInstanceOf(Money)
        expect(result[1].monthlyContribution.getAmount()).toBe(moderateAmount)
        expect(result[1].monthlyContribution.getCurrency()).toBe(goalCurrency)
        
        // Aggressive scenario
        expect(result[2].scenarioName).toBe('Agressive')
        expect(result[2].monthlyContribution).toBeInstanceOf(Money)
        expect(result[2].monthlyContribution.getAmount()).toBe(aggressiveAmount)
        expect(result[2].monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle same amounts for all scenarios', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const amount = 1000

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            amount,
            amount,
            amount
        )

        // Assert
        expect(result).toHaveLength(3)
        
        result.forEach((scenario, index) => {
            expect(scenario.monthlyContribution.getAmount()).toBe(amount)
            expect(scenario.monthlyContribution.getCurrency()).toBe(goalCurrency)
        })
        
        expect(result[0].scenarioName).toBe('Conservative')
        expect(result[1].scenarioName).toBe('Moderate')
        expect(result[2].scenarioName).toBe('Agressive')
    })

    it('should handle different currencies consistently', () => {
        
        // Arrange
        const goalCurrency = 'EUR'
        const conservativeAmount = 300
        const moderateAmount = 600
        const aggressiveAmount = 1200

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            conservativeAmount,
            moderateAmount,
            aggressiveAmount
        )

        // Assert
        expect(result).toHaveLength(3)
        
        result.forEach(scenario => {
            expect(scenario.monthlyContribution.getCurrency()).toBe(goalCurrency)
            expect(scenario.monthlyContribution).toBeInstanceOf(Money)
        })
    })

    it('should handle negative amounts in conservative scenario', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const negativeAmount = -100

        // Act
        const result = GoalProjectionScenariosService.createConservativeScenario(goalCurrency, negativeAmount)

        // Assert
        expect(result.scenarioName).toBe('Conservative')
        expect(result.monthlyContribution.getAmount()).toBe(negativeAmount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle decimal amounts in moderate scenario', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const decimalAmount = 1250.75

        // Act
        const result = GoalProjectionScenariosService.createModerateScenario(goalCurrency, decimalAmount)

        // Assert
        expect(result.scenarioName).toBe('Moderate')
        expect(result.monthlyContribution.getAmount()).toBe(decimalAmount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle decimal amounts in aggressive scenario', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const decimalAmount = 999.99

        // Act
        const result = GoalProjectionScenariosService.createAgressiveScenario(goalCurrency, decimalAmount)

        // Assert
        expect(result.scenarioName).toBe('Agressive')
        expect(result.monthlyContribution.getAmount()).toBe(decimalAmount)
        expect(result.monthlyContribution.getCurrency()).toBe(goalCurrency)
    })

    it('should handle very large amounts', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const largeAmount = 999999.99

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            largeAmount,
            largeAmount,
            largeAmount
        )

        // Assert
        expect(result).toHaveLength(3)
        result.forEach(scenario => {
            expect(scenario.monthlyContribution.getAmount()).toBe(largeAmount)
            expect(scenario.monthlyContribution.getCurrency()).toBe(goalCurrency)
        })
    })

    it('should handle mixed positive and negative amounts in multiple scenarios', () => {
        
        // Arrange
        const goalCurrency = 'EUR'
        const conservativeAmount = -500
        const moderateAmount = 0
        const aggressiveAmount = 1000

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            conservativeAmount,
            moderateAmount,
            aggressiveAmount
        )

        // Assert
        expect(result).toHaveLength(3)
        expect(result[0].monthlyContribution.getAmount()).toBe(conservativeAmount)
        expect(result[1].monthlyContribution.getAmount()).toBe(moderateAmount)
        expect(result[2].monthlyContribution.getAmount()).toBe(aggressiveAmount)
    })

    it('should return objects with correct structure for individual scenarios', () => {
        
        // Arrange
        const goalCurrency = 'BRL'
        const amount = 1000

        // Act
        const conservative = GoalProjectionScenariosService.createConservativeScenario(goalCurrency, amount)
        const moderate = GoalProjectionScenariosService.createModerateScenario(goalCurrency, amount)
        const aggressive = GoalProjectionScenariosService.createAgressiveScenario(goalCurrency, amount)

        // Assert
        const scenarios = [conservative, moderate, aggressive]
        scenarios.forEach(scenario => {
            expect(scenario).toHaveProperty('monthlyContribution')
            expect(scenario).toHaveProperty('scenarioName')
            expect(Object.keys(scenario)).toHaveLength(2)
        })
    })

    it('should return array with correct structure for multiple scenarios', () => {
        
        // Arrange
        const goalCurrency = 'USD'
        const amounts = [100, 200, 300]

        // Act
        const result = GoalProjectionScenariosService.createMultipleScenario(
            goalCurrency,
            amounts[0],
            amounts[1],
            amounts[2]
        )

        // Assert
        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(3)
        
        result.forEach((scenario, index) => {
            expect(scenario).toHaveProperty('monthlyContribution')
            expect(scenario).toHaveProperty('scenarioName')
            expect(Object.keys(scenario)).toHaveLength(2)
            expect(scenario.monthlyContribution.getAmount()).toBe(amounts[index])
        })
    })
})