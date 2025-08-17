import { Money } from "@/core/value-objects/money";
import { ProjectionScenario } from "./calculate-goal-projection";

export class GoalProjectionScenariosService {
    public static createConservativeScenario(
        goalCurrency: string,
        amount: number
    ): ProjectionScenario {
        return {
            monthlyContribution: Money.create(amount, goalCurrency),
            scenarioName: 'Conservative'
        }
    }

    public static createModerateScenario(
        goalCurrency: string,
        amount: number
    ): ProjectionScenario {
        return {
            monthlyContribution: Money.create(amount, goalCurrency),
            scenarioName: 'Moderate'
        }
    }

    public static createAgressiveScenario(
        goalCurrency: string,
        amount: number
    ): ProjectionScenario {
        return {
            monthlyContribution: Money.create(amount, goalCurrency),
            scenarioName: 'Agressive'
        }
    }

    public static createMultipleScenario(
        goalCurrency: string,
        conservativeAmount: number,
        moderateAmount: number,
        aggressiveAmount: number
    ): ProjectionScenario[] {
        return [
            this.createConservativeScenario(goalCurrency, conservativeAmount),
            this.createModerateScenario(goalCurrency, moderateAmount),
            this.createAgressiveScenario(goalCurrency, aggressiveAmount)
        ]
    }
}