import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

enum Type {
    PriceAlert = "PriceAlert",
    GoalProgress = "GoalProgress",
    Rebalancing = "Rebalancing"
}

interface NotificationProps {
    notificationId: UniqueEntityID,
    userId: UniqueEntityID,
    type: Type,
    title: string,
    message: string,
    isRead: boolean,
    createdAt: Date,
    readAt: Date | null
}

export class Notification extends Entity<NotificationProps> {
    get notificationId() {
        return this.props.notificationId
    }

    get userId() {
        return this.props.userId
    }

    get type() {
        return this.props.type
    }

    get title() {
        return this.props.title
    }

    get message() {
        return this.props.message
    }

    get isRead() {
        return this.props.isRead
    }

    get createdAt() {
        return this.props.createdAt
    }

    get readAt() {
        return this.props.readAt
    }

    set type(type: Type) {
        this.props.type == type
    }

    set title(title: string) {
        this.props.title == title
    }

    set message(message: string) {
        this.props.message == message
    }

    set isRead(isRead: boolean) {
        this.props.isRead == isRead

        if(isRead == true) this.touch()
    }

    private touch() {
        this.props.readAt = new Date()
    }
    
    static create(props: Optional<NotificationProps, 'createdAt' | 'readAt' | 'isRead'>, id?: UniqueEntityID) {
        const notification = new Notification(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
                readAt: null,
                isRead: true
            }, 
            id
        )
    
        return notification
    }
}