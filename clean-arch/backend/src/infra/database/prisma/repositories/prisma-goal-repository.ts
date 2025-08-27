import { Injectable } from "@nestjs/common";

import { GoalRepository } from "@/domain/goal/repositories/goal-repository";
import { PrismaService } from "../prisma.service";
import { Goal } from "@/domain/goal/entities/goal";
import { PrismaGoalMapper } from "../mappers/prisma-goal-mapper";

@Injectable()
export class PrismaGoalRepository implements GoalRepository {
    constructor(private prisma: PrismaService) {}

    async findById(id: string): Promise<Goal | null> {
        const goal = await this.prisma.goal.findUnique({
            where: { id },
        });

        if (!goal) {
            return null;
        }

        return PrismaGoalMapper.toDomain(goal);
    }

    async create(goal: Goal): Promise<void> {
        const data = PrismaGoalMapper.toPrisma(goal);
        await this.prisma.goal.create({ data });
    }

    async update(goal: Goal): Promise<void> {
        const data = PrismaGoalMapper.toPrisma(goal);
        await this.prisma.goal.update({ 
            where: { id: goal.id.toValue().toString() }, 
            data
        });
    }

    async delete(goal: Goal): Promise<void> {
        await this.prisma.goal.delete({ where: { id: goal.id.toValue().toString() } });
    }

}