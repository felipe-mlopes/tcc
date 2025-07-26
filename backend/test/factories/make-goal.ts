import { faker } from '@faker-js/faker'
import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Goal, GoalProps, Priority, Status } from '@/domain/goal/entities/goal'
import { Money } from '@/core/value-objects/money'

export function makeGoal(
    override: Partial<GoalProps> = {},
    id?: UniqueEntityID
) {
    const fakerName = faker.lorem.word()
    const fakerDescription = faker.lorem.sentence()
    const fakerTargetAmount = Money.create(faker.number.float({
        fractionDigits: 2
    }))
    const fakerCurrentAmount = Money.create(faker.number.float({
        fractionDigits: 2
    }))
    const fakerTargetDate = faker.date.future()

    const goal = Goal.create(
        {
            investorId: new UniqueEntityID(),
            name: fakerName,
            description: fakerDescription,
            targetAmount: fakerTargetAmount,
            currentAmount: fakerCurrentAmount,
            targetDate: fakerTargetDate,
            priority: Priority.Medium,
            status: Status.Active,            
            ...override
        },
        id
    )

    return goal
}