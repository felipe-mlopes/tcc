import { Injectable } from '@nestjs/common'
import { faker } from '@faker-js/faker'

import { UniqueEntityID } from "@/core/entities/unique-entity-id"
import { Money } from '@/core/value-objects/money'

import { Goal, GoalProps, Priority, Status } from '@/domain/goal/entities/goal'

import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaGoalMapper } from '@/infra/database/prisma/mappers/prisma-goal-mapper'

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

@Injectable()
export class GoalFactory {
    constructor(readonly prisma: PrismaService) {}

    async makePrismaGoal(data: Partial<GoalProps> = {}): Promise<Goal> {
        const goal = makeGoal(data)

        await this.prisma.goal.create({
            data: PrismaGoalMapper.toPrisma(goal)
        })

        return goal
    }
}