import { Goal } from "../entities/goal"

export interface GoalRepository {
    findById(id: string): Promise<Goal | null>
    create(goal: Goal): Promise<void>
    update(goal: Goal): Promise<void>
    delete(goal: Goal): Promise<void>
}