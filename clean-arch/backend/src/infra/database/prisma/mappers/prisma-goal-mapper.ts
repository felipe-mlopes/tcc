import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Money } from "@/core/value-objects/money";
import { Goal } from "@/domain/goal/entities/goal";
import { Prisma, Goal as PrismaGoal } from "@prisma/client";

export class PrismaGoalMapper {
    static toDomain(raw: PrismaGoal): Goal {
        return Goal.create(
            {
                investorId: new UniqueEntityID(raw.investorId),
                name: raw.name,
                description: raw.description,
                targetAmount: Money.create(raw.targetAmount.toNumber()),
                currentAmount: Money.create(raw.currentAmount.toNumber()),
                targetDate: raw.targetDate,
                priority: raw.priority as Goal['priority'],
                status: raw.status as Goal['status']
            }, 
            new UniqueEntityID(raw.id)
        );
    }

    static toPrisma(investiment: Goal): Prisma.GoalUncheckedCreateInput  {
        return {
            id: investiment.id.toValue().toString(),
            investorId: investiment.investorId.toValue().toString(),
            name: investiment.name,
            description: investiment.description,
            targetAmount: investiment.targetAmount.getAmount(),
            currentAmount: investiment.currentAmount.getAmount(),
            targetDate: investiment.targetDate,
            priority: investiment.priority,
            status: investiment.status
        }
    }
}