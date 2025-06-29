import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Money } from "@/core/value-objects/money";

enum Priority {
    High = "High",
    Medium = "Medium",
    Low = "Low"
}

enum Status {
    Active = "Active",
    Achieved = "Achieved",
    Cancelled = "Cancelled"
}

interface GoalProps {
    goalId: UniqueEntityID,
    userId: UniqueEntityID,
    name: string,
    description: string,
    targetAmount: Money,
    currentAmount: Money,
    targetDate: Date,
    priority: Priority,
    status: Status,
    createdAt: Date
}

export class Goal extends Entity<GoalProps> {}