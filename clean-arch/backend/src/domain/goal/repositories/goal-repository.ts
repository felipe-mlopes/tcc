import { Goal } from "../entities/goal"

export abstract class GoalRepository {
    abstract findById(id: string): Promise<Goal | null>
    abstract create(goal: Goal): Promise<void>
    abstract update(goal: Goal): Promise<void>
    abstract delete(goal: Goal): Promise<void>
}