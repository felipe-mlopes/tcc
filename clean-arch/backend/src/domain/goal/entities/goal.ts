import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/shared/types/optional";
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
    investorId: UniqueEntityID,
    name: string,
    description: string | null,
    targetAmount: Money,
    currentAmount: Money,
    targetDate: Date,
    priority: Priority,
    status: Status,
    createdAt: Date,
    updatedAt?: Date
}

export class Goal extends Entity<GoalProps> {
    
    public get investorId() {
        return this.props.investorId
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

    public addToCurrentAmount(amount: Money): void {
        this.props.currentAmount = this.props.currentAmount.add(amount)

        // Verifica se automaticamente se a meta foi atingida
        if (this.props.currentAmount.getAmount() >= this.props.targetAmount.getAmount()) {
            this.markAsAchieved()
        }

        this.touch()
    }

    public subtractFromCurrentAmount(amount: Money): void {
        const newAmount = this.props.currentAmount.subtract(amount)

        this.props.currentAmount = newAmount
        
        // Verifica se foi alcançado e agora está abaixo da meta
        if (this.props.status === Status.Achieved && 
            this.props.currentAmount.getAmount() < this.props.targetAmount.getAmount()) {
            this.props.status = Status.Active
        }

        this.touch()
    }

    public updateName(newName: string): void {
        this.props.name = newName.trim()
        this.touch()
    }

    public updateDescription(newDescription: string): void {
        this.props.description = newDescription.trim()
        this.touch()
    }

    public updateTargetAmount(newTargetAmount: Money): void {
        this.props.targetAmount = newTargetAmount

        // Verifica se a meta deveria ser marcada como alcançada
        if (this.props.currentAmount.getAmount() >= newTargetAmount.getAmount()) {
            this.markAsAchieved()
        }

        this.touch()
    }

    public updateTargetDate(newTargetDate: Date): void {
        this.props.targetDate = newTargetDate
        this.touch()
    }

    public updatePriority(newPriority: Priority): void {
        this.props.priority = newPriority
        this.touch()
    }

    public markAsAchieved(): void {
        this.props.status = Status.Achieved
        this.touch()
    }

    public cancel(): void {
        this.props.status = Status.Cancelled
        this.touch()
    }

    public reactivate(): void {
        this.props.status = Status.Active
        this.touch()
    }

    public belongsToUser(investorId: UniqueEntityID): boolean {
        return this.props.investorId.equals(investorId)
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

    public static create(
        props: Optional<GoalProps, 'createdAt' | 'currentAmount' | 'status'> & {
            status?: Status // Tornar status opcional sem valor padrão
        },
        id?: UniqueEntityID
    ): Goal {
        const goal = new Goal(
            {
                ...props,
                name: props.name.trim(),
                description: props.description?.trim() || '',
                currentAmount: props.currentAmount || Money.zero(props.targetAmount.getCurrency()),
                status: props.status ?? Status.Active,
                createdAt: props.createdAt || new Date()
            },
            id
        )

        return goal
    }
}