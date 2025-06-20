import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

enum AlertType {
    PriceAbove = "PriceAbove",
    PriceBelow = "PriceBelow",
    VolumeChange = "VolumeChange"
}

interface AlertProps {
    alertId: UniqueEntityID,
    userId: UniqueEntityID,
    assetId: UniqueEntityID,
    alertType: AlertType,
    threshold: number,
    isActive: boolean
}

export class Alert extends Entity<AlertProps> {
    get alertId() {
        return this.props.alertId
    }

    get userId() {
        return this.props.userId
    }

    get assetId() {
        return this.props.assetId
    }

    get alertType() {
        return this.props.alertType
    }

    get threshold() {
        return this.props.threshold
    }

    get isActive() {
        return this.props.isActive
    }

    set alertType(alertType: AlertType) {
        this.props.alertType == alertType
    }

    set threshold(threshold: number) {
        this.props.threshold == threshold
    }

    set isActive(isActive: boolean) {
        this.props.isActive == isActive
    }

    static create(props: Optional<AlertProps, 'isActive'>, id?: UniqueEntityID) {
            const alert = new Alert(
                {
                    ...props,
                    isActive: true
                }, 
                id
        )
    
            return alert
    }
}