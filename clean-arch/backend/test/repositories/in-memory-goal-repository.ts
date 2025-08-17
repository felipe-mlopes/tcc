import { Goal } from "@/domain/goal/entities/goal";
import { GoalRepository } from "@/domain/goal/repositories/goal-repository";

export class InMemoryGoalRepository implements GoalRepository {
    public items: Goal[] = []

    async findById(id: string): Promise<Goal | null> {
        const goal = this.items.find(item => item.id.toString() === id)

        if (!goal) return null

        return goal
    }

    async create(goal: Goal): Promise<void> {
        this.items.push(goal)
    }

    async update(goal: Goal): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === goal.id)

        this.items[itemIndex] = goal
    }

    async delete(goal: Goal): Promise<void> {
        const itemIndex = this.items.findIndex(item => item.id === goal.id)
        
        this.items.splice(itemIndex, 1)
    }
}