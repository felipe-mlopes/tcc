import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Money } from "@/core/value-objects/money";
import { Percentage } from "@/core/value-objects/percentage";

export enum Priority {
    High = "High",
    Medium = "Medium",
    Low = "Low"
}

export enum Status {
    Active = "Active",
    Achieved = "Achieved",
    Cancelled = "Cancelled"
}

export interface GoalProps {
    goalId: UniqueEntityID,
    userId: UniqueEntityID,
    name: string,
    description: string,
    targetAmount: Money,
    currentAmount: Money,
    targetDate: Date,
    priority: Priority,
    status: Status,
    createdAt: Date,
    updatedAt?: Date
}

export class Goal extends Entity<GoalProps> {
    
    // Getters
    public get goalId() {
        return this.props.goalId
    }

    public get userId() {
        return this.props.userId
    }

    public get name() {
        return this.props.name
    }

    public get description() {
        return this.props.description
    }

    public get targetAmount() {
        return this.props.targetAmount
    }

    public get currentAmount() {
        return this.props.currentAmount
    }

    public get targetDate() {
        return this.props.targetDate
    }

    public get priority() {
        return this.props.priority
    }

    public get status() {
        return this.props.status
    }

    public get createdAt() {
        return this.props.createdAt
    }

    public get updatedAt() {
        return this.props.updatedAt
    }

    // Computed Properties
    public get progress(): Percentage {
        if (this.props.targetAmount.getAmount() === 0) {
            return Percentage.zero()
        }

        const progressDecimal = this.props.currentAmount.getAmount() / this.props.targetAmount.getAmount()
        const clampedProgress = Math.min(progressDecimal, 1) // Limita a 100%
        
        return Percentage.fromDecimal(clampedProgress)
    }

    public get remainingAmount(): Money {
        const remaining = this.props.targetAmount.subtract(this.props.currentAmount)
        return remaining.getAmount() < 0 ? Money.zero(this.props.targetAmount.getCurrency()) : remaining
    }

    public get daysUntilTarget(): number {
        const today = new Date()
        const timeDiff = this.props.targetDate.getTime() - today.getTime()
        return Math.ceil(timeDiff / (1000 * 3600 * 24))
    }

    public get isOverdue(): boolean {
        return this.daysUntilTarget < 0 && this.props.status === Status.Active
    }

    public get isAchieved(): boolean {
        return this.props.status === Status.Achieved || this.progress.getValue() >= 100
    }

    // Business Methods
    public addToCurrentAmount(amount: Money): void {
/*         if (amount.getAmount() <= 0) {
            throw new Error('Amount to add must be positive')
        }

        if (amount.getCurrency() !== this.props.currentAmount.getCurrency()) {
            throw new Error('Currency must match the goal currency')
        }

        if (this.props.status !== Status.Active) {
            throw new Error('Cannot add amount to inactive goal')
        } */

        this.props.currentAmount = this.props.currentAmount.add(amount)

        // Auto-achieve goal if target is reached
        if (this.props.currentAmount.getAmount() >= this.props.targetAmount.getAmount()) {
            this.markAsAchieved()
        }

        this.touch()
    }

    public subtractFromCurrentAmount(amount: Money): void {
/*         if (amount.getAmount() <= 0) {
            throw new Error('Amount to subtract must be positive')
        }

        if (amount.getCurrency() !== this.props.currentAmount.getCurrency()) {
            throw new Error('Currency must match the goal currency')
        }

        if (this.props.status !== Status.Active) {
            throw new Error('Cannot subtract amount from inactive goal')
        } */

        const newAmount = this.props.currentAmount.subtract(amount)
        
/*         if (newAmount.getAmount() < 0) {
            throw new Error('Current amount cannot be negative')
        } */

        this.props.currentAmount = newAmount
        
        // If was achieved and now is below target, reactivate
        if (this.props.status === Status.Achieved && 
            this.props.currentAmount.getAmount() < this.props.targetAmount.getAmount()) {
            this.props.status = Status.Active
        }

        this.touch()
    }

    public updateName(newName: string): void {
/*         if (!newName || newName.trim().length === 0) {
            throw new Error('Goal name cannot be empty')
        } */

        this.props.name = newName.trim()
        this.touch()
    }

    public updateDescription(newDescription: string): void {
        this.props.description = newDescription.trim()
        this.touch()
    }

    public updateTargetAmount(newTargetAmount: Money): void {
/*         if (newTargetAmount.getAmount() <= 0) {
            throw new Error('Target amount must be positive')
        }

        if (newTargetAmount.getCurrency() !== this.props.targetAmount.getCurrency()) {
            throw new Error('Currency must match the goal currency')
        }

        if (this.props.status !== Status.Active) {
            throw new Error('Cannot update target amount of inactive goal')
        } */

        this.props.targetAmount = newTargetAmount

        // Check if goal should be marked as achieved
        if (this.props.currentAmount.getAmount() >= newTargetAmount.getAmount()) {
            this.markAsAchieved()
        }

        this.touch()
    }

    public updateTargetDate(newTargetDate: Date): void {
/*         if (newTargetDate <= new Date()) {
            throw new Error('Target date must be in the future')
        }

        if (this.props.status !== Status.Active) {
            throw new Error('Cannot update target date of inactive goal')
        } */

        this.props.targetDate = newTargetDate
        this.touch()
    }

    public updatePriority(newPriority: Priority): void {
        this.props.priority = newPriority
        this.touch()
    }

    public markAsAchieved(): void {
/*         if (this.props.status === Status.Cancelled) {
            throw new Error('Cannot achieve a cancelled goal')
        } */

        this.props.status = Status.Achieved
        this.touch()
    }

    public cancel(): void {
/*         if (this.props.status === Status.Achieved) {
            throw new Error('Cannot cancel an achieved goal')
        } */

        this.props.status = Status.Cancelled
        this.touch()
    }

    public reactivate(): void {
/*         if (this.props.status === Status.Active) {
            throw new Error('Goal is already active')
        } */

        // Only allow reactivation if not achieved or if achieved but below target
/*         if (this.props.status === Status.Achieved && 
            this.props.currentAmount.getAmount() >= this.props.targetAmount.getAmount()) {
            throw new Error('Cannot reactivate a fully achieved goal')
        } */

        this.props.status = Status.Active
        this.touch()
    }

    // Utility Methods
    public belongsToUser(userId: UniqueEntityID): boolean {
        return this.props.userId.equals(userId)
    }

    public isHighPriority(): boolean {
        return this.props.priority === Priority.High
    }

    public isMediumPriority(): boolean {
        return this.props.priority === Priority.Medium
    }

    public isLowPriority(): boolean {
        return this.props.priority === Priority.Low
    }

    public isActive(): boolean {
        return this.props.status === Status.Active
    }

    public isCancelled(): boolean {
        return this.props.status === Status.Cancelled
    }

    public requiresImmediateAttention(): boolean {
        return this.isActive() && 
               (this.isHighPriority() || this.daysUntilTarget <= 30 || this.isOverdue)
    }

    public equals(other: Goal): boolean {
        return this.id.equals(other.id)
    }

    private touch(): void {
        this.props.updatedAt = new Date()
    }

    // Factory Method
    public static create(
        props: Optional<GoalProps, 'createdAt' | 'currentAmount'> & {
            status?: Status // Tornar status opcional sem valor padrão
        },
        id?: UniqueEntityID
    ): Goal {

/*         if (!props.name || props.name.trim().length === 0) {
            throw new Error('Goal name is required')
        }

        if (props.targetAmount.getAmount() <= 0) {
            throw new Error('Target amount must be positive')
        }

        if (props.targetDate <= new Date()) {
            throw new Error('Target date must be in the future')
        } */

        const goal = new Goal(
            {
                ...props,
                name: props.name.trim(),
                description: props.description?.trim() || '',
                currentAmount: props.currentAmount || Money.zero(props.targetAmount.getCurrency()),
                status: props.status ?? Status.Active, // Usar nullish coalescing
                createdAt: props.createdAt || new Date()
            },
            id
        )

        return goal
    }
}